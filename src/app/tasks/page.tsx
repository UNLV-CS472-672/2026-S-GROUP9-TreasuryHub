"use client";

import { useEffect, useState, Suspense } from "react";
import {
  getTasks,
  addTaskAction,
  updateTaskAction,
  deleteTaskAction,
  getTaskAssignmentOptions,
} from "./actions";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "next/navigation";
import Skeleton from "@/components/Skeleton";

/*
  This defines what a Task looks like in our app.
  I added:
  - type: what kind of task it is
  - assignType: whether it is assigned to a role or an individual
  - assignedTo: the actual role/member name
  - dueDate: optional due date
  - notify_days_before: how many days before due date we should alert
*/
type Task = {
  id: number;
  title: string;
  type: string;
  assignType: "role" | "individual";
  assignedTo: string;
  dueDate?: string;
  notify_days_before?: number;
};

/*
  This type matches what comes back from the Supabase tasks table.
  We keep this separate because the database column names use snake_case.
*/
type DatabaseTask = {
  id: number;
  title: string;
  task_type: string;
  assign_type: "role" | "individual";
  assigned_to: string;
  due_date?: string | null;
  notify_days_before?: number | null;
};

/*
  existing roles and members.
  For now they are hardcoded, but later these could come from a database.
*/

/*
  The UC says only officer-level or above can create/edit/delete tasks.
*/
const currentUserRole = "Officer";

/*
  Helper function to check if the current user has permission.
  For this frontend version, officer and treasurer are allowed.
*/
function hasOfficerAccess(role: string) {
  return role === "Officer" || role === "Treasurer";
}

/*
  TODO(issue #59 follow-up): tasks still use placeholder demo roles and are not wired into src/lib/roles.ts yet.
*/

function TasksPageContent() {
  // Grab the orgId 
  const orgId = useSearchParams().get('orgId');
  // stores all tasks from Supabase
  const [tasks, setTasks] = useState<Task[]>([]);

  // true while the initial fetch is in flight
  const [loading, setLoading] = useState(true);

  // stores form input values
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("TODO");
  const [assignType, setAssignType] = useState<"role" | "individual">("role");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  // stores real roles and members from the database
  const [existingRoles, setExistingRoles] = useState<string[]>([]);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);

  /*
    This loads tasks from Supabase when the page first opens.
  */
  useEffect(() => {
    const fetchTasks = async () => {
      if(!orgId) return;

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

      const optionsResult = await getTaskAssignmentOptions();

      if (optionsResult.error) {
        alert(optionsResult.error);
        setLoading(false);
        return;
      }

      setExistingRoles(optionsResult.roles);
      setExistingMembers(optionsResult.members);
      setLoading(false);
    };

    fetchTasks();
  }, [orgId]);

  /*
    FUNCTION: isValidFutureDate
    Checks if the selected date is a valid future date.
  */
  const isValidFutureDate = (dateString: string) => {
    if (!dateString) return true; // due date is optional

    const selectedDate = new Date(dateString);
    const today = new Date();

    // set time to midnight so comparison is only by date, not by hours/minutes
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate > today;
  };

  /*
    FUNCTION: isValidAssignment
    Makes sure the selected role or member actually exists.
  */
  const isValidAssignment = () => {
    if (assignType === "role") {
      return existingRoles.includes(assignedTo);
    } else {
      return existingMembers.includes(assignedTo);
    }
  };

  /*
    FUNCTION: addTask
    - checks permissions
    - validates title
    - validates due date
    - validates assignment
    - sends the new task to the backend action
  */
  const addTask = async () => {
    // only officer-level or above can do this
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can create tasks.");
      return;
    }

    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    if (!assignedTo) {
      alert("Please assign the task to a role or individual.");
      return;
    }

    if (!isValidAssignment()) {
      alert("Task must be assigned to an existing role or member.");
      return;
    }

    if (!isValidFutureDate(dueDate)) {
      alert("Due date must be a valid future date.");
      return;
    }

    if(!orgId) {
      alert("Organization ID was not found.")
      return;
    }

    const result = await addTaskAction({
      title,
      taskType,
      assignType,
      assignedTo,
      dueDate,
      orgId,
    });

    if (result?.error) {
      alert(result.error);
      return;
    }

    // clear form after adding
    setTitle("");
    setTaskType("TODO");
    setAssignType("role");
    setAssignedTo("");
    setDueDate("");

    window.location.reload();
  };

  /*
    FUNCTION: editTask
    Lets the user edit all main task fields.
  */
  const editTask = async (id: number) => {
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can edit tasks.");
      return;
    }

    if (!orgId) {
      alert("Organization ID was not found.");
      return;
    }

    const taskToEdit = tasks.find((task) => task.id === id);
    if (!taskToEdit) return;

    const newTitle = prompt("Edit task title:", taskToEdit.title);
    if (!newTitle || !newTitle.trim()) {
      alert("Task title cannot be empty.");
      return;
    }

    const newType = prompt(
      "Edit task type (TODO, EVENT, INVOICE, PAYROLL, PAYMENT, FUNDRAISER, MEETING):",
      taskToEdit.type
    );
    if (!newType || !newType.trim()) {
      alert("Task type cannot be empty.");
      return;
    }

    const newAssignTypeInput = prompt(
      "Assign to 'role' or 'individual':",
      taskToEdit.assignType
    );

    if (
      newAssignTypeInput !== "role" &&
      newAssignTypeInput !== "individual"
    ) {
      alert("Assignment type must be either 'role' or 'individual'.");
      return;
    }

    const newAssignedTo = prompt(
      `Enter existing ${newAssignTypeInput}:`,
      taskToEdit.assignedTo
    );

    if (!newAssignedTo || !newAssignedTo.trim()) {
      alert("Assigned value cannot be empty.");
      return;
    }

    // validate edited assignment
    if (
      (newAssignTypeInput === "role" &&
        !existingRoles.includes(newAssignedTo)) ||
      (newAssignTypeInput === "individual" &&
        !existingMembers.includes(newAssignedTo))
    ) {
      alert("Task must be assigned to an existing role or member.");
      return;
    }

    const newDueDate = prompt(
      "Edit due date in YYYY-MM-DD format (leave blank for no due date):",
      taskToEdit.dueDate || ""
    );

    if (newDueDate && !isValidFutureDate(newDueDate)) {
      alert("Due date must be a valid future date.");
      return;
    }

    const result = await updateTaskAction(id, {
      title: newTitle,
      taskType: newType,
      assignType: newAssignTypeInput,
      assignedTo: newAssignedTo,
      dueDate: newDueDate || "",
      orgId,
    });

    if (result.error) {
      alert(result.error);
      return;
    }

    // simple refresh so the newest DB data shows up right away
    window.location.reload();
  };

  /*
    FUNCTION: deleteTask
    Removes a task from the database using the backend action
  */
  const deleteTask = async (id: number) => {
    if (!hasOfficerAccess(currentUserRole)) {
      alert("Only officer-level users or above can delete tasks.");
      return;
    }
    if (!orgId) {
      alert("Organization ID was not found.");
      return;
    }

    const result = await deleteTaskAction(id, orgId);

    if (result.error) {
      alert(result.error);
      return;
    }

    // reload so the deleted task disappears from the list
    window.location.reload();
  };

  /*
    FUNCTION: getAlert
    Shows an alert label based on the due date.
    Since due dates must be future dates, this will mainly show:
    - due tomorrow
    - upcoming
  */
  function getAlert(dueDate?: string) {
    if (!dueDate) return "";

    const today = new Date();
    const due = new Date(dueDate);

    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diff = Math.floor(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 1) return "🟡 DUE TOMORROW";
    if (diff <= 3) return "🟢 UPCOMING";
    return "";
  }

  /*
    FUNCTION: getNotifications
    This builds the alert banner list.
    If a task is within its notify_days_before window, we show it at the top.
  */
  function getNotifications(tasks: Task[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate) return false;

      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      const diff = Math.floor(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const notifyDays = task.notify_days_before ?? 3;

      return diff <= notifyDays && diff >= 0;
    });
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex justify-between mb-6">
        <h1>Task List</h1>
      
          <BackButton></BackButton>
        
      </div>

      {/* alert banner for tasks that are getting close to due date */}
 {getNotifications(tasks).length > 0 && (
  <div
    style={{
      background: "#e5e7eb",
      color: "#111827",
      padding: "10px",
      border: "1px solid #9ca3af",
      borderRadius: "6px",
      marginBottom: "20px",
    }}
  >
    <strong>Upcoming Task Alerts:</strong>
    {getNotifications(tasks).map((task) => (
      <div key={task.id} style={{ marginTop: "4px" }}>
        {task.title} is due on {task.dueDate}
      </div>
    ))}
  </div>
)}

      {/* showing current user role just for demo/testing */}
      <p>
        <strong>Current User Role:</strong> {currentUserRole}
      </p>

      {/* INPUT SECTION */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
          <Skeleton width="100%" height={32} rounded="md" />
          <Skeleton width="100%" height={32} rounded="md" />
          <Skeleton width="100%" height={32} rounded="md" />
          <Skeleton width="100%" height={32} rounded="md" />
          <Skeleton width="100%" height={32} rounded="md" />
          <Skeleton width={100} height={32} rounded="md" />
        </div>
      ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
        }}
      >
        {/* task title */}
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* task type dropdown */}
        <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
          <option value="TODO">To-Do</option>
          <option value="EVENT">Event</option>
          <option value="INVOICE">Invoice Due Date</option>
          <option value="PAYROLL">Payroll Deadline</option>
          <option value="PAYMENT">Scheduled Payment</option>
          <option value="FUNDRAISER">Fundraiser</option>
          <option value="MEETING">Meeting</option>
        </select>

        {/* choose whether assignment is to a role or individual */}
        <select
          value={assignType}
          onChange={(e) =>
            setAssignType(e.target.value as "role" | "individual")
          }
        >
          <option value="role">Assign to Role</option>
          <option value="individual">Assign to Individual</option>
        </select>

        {/* assignment dropdown changes depending on assignType */}
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Select Assignment</option>

          {assignType === "role"
            ? existingRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))
            : existingMembers.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
        </select>

        {/* optional due date */}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* add task button */}
        <button onClick={addTask}>Add Task</button>
      </div>
      )}

      {/* TASK LIST */}
      <ul style={{ marginTop: "20px" }}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                style={{
                  marginBottom: "12px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                }}
              >
                <Skeleton width={180} height={16} />
                <div style={{ marginTop: "6px" }}><Skeleton width={120} height={14} /></div>
                <div style={{ marginTop: "6px" }}><Skeleton width={200} height={14} /></div>
                <div style={{ marginTop: "6px" }}><Skeleton width={100} height={14} /></div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <Skeleton width={58} height={26} rounded="sm" />
                  <Skeleton width={42} height={26} rounded="sm" />
                </div>
              </li>
            ))
          : tasks.map((task) => (
          <li
            key={task.id}
            style={{
              marginBottom: "12px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            {/* main task info */}
            <strong>{task.title}</strong>
            <div>Type: {task.type}</div>
            <div>
              Assigned {task.assignType === "role" ? "Role" : "Individual"}:{" "}
              {task.assignedTo}
            </div>

            {task.dueDate && <div>Due: {task.dueDate}</div>}

            <div>{getAlert(task.dueDate)}</div>

            {/* action buttons */}
            <button
              onClick={() => deleteTask(task.id)}
              style={{ marginTop: "8px", marginRight: "8px" }}
            >
              Delete
            </button>

            <button
              onClick={() => editTask(task.id)}
              style={{ marginTop: "8px" }}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


// Suspense boundary for useSearchParams()
export default function TasksPage() {
        return (
            <Suspense
                fallback={
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton width={64} height={28} />
                            <Skeleton width={112} height={38} rounded="sm" />
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex gap-2">
                                <Skeleton width={56} height={38} rounded="sm" />
                                <Skeleton width={72} height={38} rounded="sm" />
                                <Skeleton width={88} height={38} rounded="sm" />
                            </div>
                        </div>
                        <ul className="divide-y border rounded-lg">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <li key={i} className="flex items-center justify-between p-4">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton width={200} height={16} />
                                        <Skeleton width={140} height={13} />
                                    </div>
                                    <Skeleton width={36} height={14} />
                                </li>
                            ))}
                        </ul>
                    </div>
                }
            >
                <TasksPageContent />
            </Suspense>
        )
}