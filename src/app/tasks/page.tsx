"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import Skeleton from "@/components/Skeleton";
import { useSearchParams } from "next/navigation";
import {
  addTaskAction,
  deleteTaskAction,
  getTaskAssignmentOptions,
  getTasks,
  updateTaskAction,
} from "./actions";

type Task = {
  id: number;
  title: string;
  type: string;
  assignType: "role" | "individual";
  assignedTo: string;
  dueDate?: string;
  notify_days_before?: number;
};

type DatabaseTask = {
  id: number;
  title: string;
  task_type: string;
  assign_type: "role" | "individual";
  assigned_to: string;
  due_date?: string | null;
  notify_days_before?: number | null;
};

type SkeletonPulseProps = { className?: string };
function SkeletonPulse({ className = "" }: SkeletonPulseProps) {
  return (
    <div className={`animate-pulse rounded bg-white/[0.08] ${className}`} />
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const selectClass =
  "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-[#181818] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"; //changed

function TasksPageContent() {
  const orgId = useSearchParams().get("orgId");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("TODO");
  const [assignType, setAssignType] = useState<"role" | "individual">("role");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [existingRoles, setExistingRoles] = useState<string[]>([]);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const [canManageCurrentTasks, setCanManageCurrentTasks] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!orgId) {
        alert("Organization ID was not found.");
        setLoading(false);
        return;
      }

      const result = await getTasks(orgId);
      if (result.error) {
        alert(result.error);
        setLoading(false);
        return;
      }

      const formattedTasks: Task[] = (result.data as DatabaseTask[]).map(
        (task) => ({
          id: task.id,
          title: task.title,
          type: task.task_type,
          assignType: task.assign_type,
          assignedTo: task.assigned_to,
          dueDate: task.due_date ?? "",
          notify_days_before: task.notify_days_before ?? 3,
        })
      );

      setTasks(formattedTasks);

      const optionsResult = await getTaskAssignmentOptions(orgId);
      if (optionsResult.error) {
        alert(optionsResult.error);
      }
      setCanManageCurrentTasks(optionsResult.canManage);
      setExistingRoles(optionsResult.roles);
      setExistingMembers(optionsResult.members);
      setLoading(false);
    };

    fetchTasks();
  }, [orgId]);

  const isValidFutureDate = (dateString: string) => {
    if (!dateString) return true;
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate > today;
  };

  const isValidAssignment = () => {
    if (assignType === "role") return existingRoles.includes(assignedTo);
    return existingMembers.includes(assignedTo);
  };

  const addTask = async () => {
    if (!canManageCurrentTasks) { alert("You do not have permission to create tasks."); return; }
    if (!title.trim()) { alert("Task title is required."); return; }
    if (!assignedTo) { alert("Please assign the task to a role or individual."); return; }
    if (!isValidAssignment()) { alert("Task must be assigned to an existing role or member."); return; }
    if (!isValidFutureDate(dueDate)) { alert("Due date must be a valid future date."); return; }
    if (!orgId) { alert("Organization ID was not found."); return; }

    const result = await addTaskAction({ title, taskType, assignType, assignedTo, dueDate, orgId });
    if (result?.error) { alert(result.error); return; }

    setTitle(""); setTaskType("TODO"); setAssignType("role"); setAssignedTo(""); setDueDate("");
    window.location.reload();
  };

  const editTask = (id: number) => {
    if (!canManageCurrentTasks) { alert("You do not have permission to edit tasks."); return; }
    if (!orgId) { alert("Organization ID was not found."); return; }
    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;
    setTitle(taskToEdit.title);
    setTaskType(taskToEdit.type);
    setAssignType(taskToEdit.assignType);
    setAssignedTo(taskToEdit.assignedTo);
    setDueDate(taskToEdit.dueDate || "");
    setEditingTask(taskToEdit);
    dialogRef.current?.showModal();
  };

  const handleEditSubmit = async () => {
    if (!editingTask || !orgId) return;
    const result = await updateTaskAction(editingTask.id, { title, taskType, assignType, assignedTo, dueDate, orgId });
    if (result.error) { alert(result.error); return; }
    dialogRef.current?.close();
    setEditingTask(null);
    window.location.reload();
  };

  const deleteTask = async (id: number) => {
    if (!canManageCurrentTasks) { alert("You do not have permission to delete tasks."); return; }
    if (!orgId) { alert("Organization ID was not found."); return; }
    const result = await deleteTaskAction(id, orgId);
    if (result.error) { alert(result.error); return; }
    window.location.reload();
  };

  function getAlert(dueDate?: string) {
    if (!dueDate) return "";
    const today = new Date(); const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0); due.setHours(0, 0, 0, 0);
    const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) return "🟡 DUE TOMORROW";
    if (diff <= 3) return "🟢 UPCOMING";
    return "";
  }

  function getNotifications(tasks: Task[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const notifyDays = task.notify_days_before ?? 3;
      return diff <= notifyDays && diff >= 0;
    });
  }

  const taskTypeOptions = [
    { value: "TODO", label: "To-Do" },
    { value: "EVENT", label: "Event" },
    { value: "INVOICE", label: "Invoice Due Date" },
    { value: "PAYROLL", label: "Payroll Deadline" },
    { value: "PAYMENT", label: "Scheduled Payment" },
    { value: "FUNDRAISER", label: "Fundraiser" },
    { value: "MEETING", label: "Meeting" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Task List</h1>
          <BackButton />
        </div>

        {/* Upcoming alerts banner */}
        {getNotifications(tasks).length > 0 && (
          <div className="mb-6 rounded-2xl border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Upcoming Task Alerts</p>
            <ul className="space-y-1">
              {getNotifications(tasks).map((task) => (
                <li key={task.id} className="text-sm text-yellow-700 dark:text-yellow-400">
                  {task.title} is due on {task.dueDate}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-8">
          {/* Add Task Form — only visible to managers */}
          {canManageCurrentTasks && (
            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Add Task</h2>

              {loading ? (
                <div className="flex flex-col gap-3 max-w-md">
                  <SkeletonPulse className="h-9 w-full" />
                  <SkeletonPulse className="h-9 w-full" />
                  <SkeletonPulse className="h-9 w-full" />
                  <SkeletonPulse className="h-9 w-full" />
                  <SkeletonPulse className="h-9 w-full" />
                  <SkeletonPulse className="h-9 w-24" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-w-md">
                  <input
                    placeholder="Task title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputClass}
                  />
                  <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={selectClass}>
                    {taskTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select value={assignType} onChange={(e) => setAssignType(e.target.value as "role" | "individual")} className={selectClass}>
                    <option value="role">Assign to Role</option>
                    <option value="individual">Assign to Individual</option>
                  </select>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={selectClass}>
                    <option value="">Select Assignment</option>
                    {assignType === "role"
                      ? existingRoles.map((role) => <option key={role} value={role}>{role}</option>)
                      : existingMembers.map((member) => <option key={member} value={member}>{member}</option>)}
                  </select>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputClass}
                  />
                  <button
                    onClick={addTask}
                    className="self-start rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                  >
                    Add Task
                  </button>
                </div>
              )}
            </section>
          )}

          {!loading && !canManageCurrentTasks && (
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              You can view tasks for this organization, but only treasury team, treasurer, and admin roles can create, edit, or delete tasks.
            </p>
          )}

          {/* Task List */}
          <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Tasks</h2>

            <ul className="space-y-4 max-w-2xl">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.02] p-5">
                    <SkeletonPulse className="h-4 w-44 mb-3" />
                    <SkeletonPulse className="h-3 w-28 mb-2" />
                    <SkeletonPulse className="h-3 w-48 mb-2" />
                    <SkeletonPulse className="h-3 w-24 mb-3" />
                    <div className="flex gap-2">
                      <SkeletonPulse className="h-7 w-14 rounded" />
                      <SkeletonPulse className="h-7 w-10 rounded" />
                    </div>
                  </li>
                ))
                : tasks.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.12] px-4 py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                    No tasks yet.
                  </li>
                ) : tasks.map((task) => (
                  <li key={task.id} className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</strong>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/[0.12] text-gray-600 dark:text-neutral-300">
                        {task.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-neutral-400 flex flex-col gap-1 mb-2">
                      <div>
                        Assigned {task.assignType === "role" ? "Role" : "Individual"}:{" "}
                        <span className="text-gray-700 dark:text-neutral-200">{task.assignedTo}</span>
                      </div>
                      {task.dueDate && (
                        <div>Due: <span className="text-gray-700 dark:text-neutral-200">{task.dueDate}</span></div>
                      )}
                    </div>
                    {getAlert(task.dueDate) && (
                      <p className="text-xs mb-2">{getAlert(task.dueDate)}</p>
                    )}
                    {canManageCurrentTasks && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => editTask(task.id)}
                          className="rounded-lg border border-gray-200 dark:border-white/[0.15] bg-white dark:bg-white/[0.05] px-3 py-1 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        </div>

        {/* Edit Task Dialog */}
        <dialog
          ref={dialogRef}
          className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-[#0a0a0a] p-6 shadow-2xl backdrop:bg-black/50 min-w-[350px]"
        >
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Edit Task</h2>
          <div className="flex flex-col gap-3">
            <input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={selectClass}>
              {taskTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={assignType} onChange={(e) => setAssignType(e.target.value as "role" | "individual")} className={selectClass}>
              <option value="role">Assign to Role</option>
              <option value="individual">Assign to Individual</option>
            </select>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={selectClass}>
              <option value="">Select Assignment</option>
              {assignType === "role"
                ? existingRoles.map((role) => <option key={role} value={role}>{role}</option>)
                : existingMembers.map((member) => <option key={member} value={member}>{member}</option>)}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleEditSubmit}
                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  dialogRef.current?.close();
                  setEditingTask(null);
                  setTitle(""); setTaskType("TODO"); setAssignType("role"); setAssignedTo(""); setDueDate("");
                }}
                className="rounded-xl border border-gray-200 dark:border-white/[0.15] bg-white dark:bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>

      </div>
    </main>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background text-foreground">
          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <Skeleton width={80} height={28} />
              <Skeleton width={80} height={36} rounded="sm" />
            </div>
            <ul className="space-y-4 max-w-2xl">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-white/[0.12]">
                  <div className="flex flex-col gap-2">
                    <Skeleton width={200} height={16} />
                    <Skeleton width={140} height={13} />
                  </div>
                  <Skeleton width={36} height={14} />
                </li>
              ))}
            </ul>
          </div>
        </main>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
