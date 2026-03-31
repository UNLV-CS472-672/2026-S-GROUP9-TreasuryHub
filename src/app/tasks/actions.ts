"use server";

import { createClient } from "@/lib/supabase/server";

const validTaskTypes = [
  "TODO",
  "EVENT",
  "INVOICE",
  "PAYROLL",
  "PAYMENT",
  "FUNDRAISER",
  "MEETING",
] as const;

const validRoles = ["Officer", "Treasurer", "Secretary", "Member"];
const validMembers = ["Prabh", "Enrique", "Mathew", "Danilo", "Keith", "Tracy", "Ricardo", "Kaley", "Miguel", "Xae"];

// temporary until real auth/roles are connected
const currentUserRole = "Officer";

function hasOfficerAccess(role: string) {
  return role === "Officer" || role === "Treasurer";
}

function isValidFutureDate(dateString?: string) {
  if (!dateString) return true;

  const selectedDate = new Date(dateString);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate > today;
}

function isValidAssignment(assignType: string, assignedTo: string) {
  if (assignType === "role") {
    return validRoles.includes(assignedTo);
  }

  if (assignType === "individual") {
    return validMembers.includes(assignedTo);
  }

  return false;
}

// get all tasks
export async function getTasks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { error: null, data: data ?? [] };
}

// create task
export async function addTaskAction(formData: {
  title: string;
  taskType: string;
  assignType: "role" | "individual";
  assignedTo: string;
  dueDate?: string;
  //notify_days_before: 3;
}) {
  if (!hasOfficerAccess(currentUserRole)) {
    return { error: "Only officer-level users or above can create tasks." };
  }

  const { title, taskType, assignType, assignedTo, dueDate } = formData;

  if (!title.trim()) {
    return { error: "Task title is required." };
  }

  if (!validTaskTypes.includes(taskType as (typeof validTaskTypes)[number])) {
    return { error: "Invalid task type." };
  }

  if (!assignedTo) {
    return { error: "Please assign the task to a role or individual." };
  }

  if (!isValidAssignment(assignType, assignedTo)) {
    return { error: "Task must be assigned to an existing role or member." };
  }

  if (!isValidFutureDate(dueDate)) {
    return { error: "Due date must be a valid future date." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert([
    {
      title: title.trim(),
      task_type: taskType,
      assign_type: assignType,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      notify_days_before: 3,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// edit task
export async function updateTaskAction(
  id: number,
  formData: {
    title: string;
    taskType: string;
    assignType: "role" | "individual";
    assignedTo: string;
    dueDate?: string;
  }
) {
  if (!hasOfficerAccess(currentUserRole)) {
    return { error: "Only officer-level users or above can edit tasks." };
  }

  const { title, taskType, assignType, assignedTo, dueDate } = formData;

  if (!title.trim()) {
    return { error: "Task title is required." };
  }

  if (!validTaskTypes.includes(taskType as (typeof validTaskTypes)[number])) {
    return { error: "Invalid task type." };
  }

  if (!assignedTo) {
    return { error: "Please assign the task to a role or individual." };
  }

  if (!isValidAssignment(assignType, assignedTo)) {
    return { error: "Task must be assigned to an existing role or member." };
  }

  if (!isValidFutureDate(dueDate)) {
    return { error: "Due date must be a valid future date." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      task_type: taskType,
      assign_type: assignType,
      assigned_to: assignedTo,
      due_date: dueDate || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// delete task
export async function deleteTaskAction(id: number) {
  if (!hasOfficerAccess(currentUserRole)) {
    return { error: "Only officer-level users or above can delete tasks." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}