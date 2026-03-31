"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchOrgFromCurrentUser } from "@/app/transaction/lib/data";

const validTaskTypes = [
  "TODO",
  "EVENT",
  "INVOICE",
  "PAYROLL",
  "PAYMENT",
  "FUNDRAISER",
  "MEETING",
] as const;

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

async function isValidAssignment(assignType: string, assignedTo: string) {
  const supabase = await createClient();
  const orgId = await fetchOrgFromCurrentUser();

  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  if (orgMembersError || !orgMembers) {
    return false;
  }

  if (assignType === "role") {
    const validRoles = [...new Set(orgMembers.map((member) => member.role))];
    return validRoles.includes(assignedTo);
  }

  if (assignType === "individual") {
    const userIds = orgMembers.map((member) => member.user_id);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (usersError || !users) {
      return false;
    }

    const validMembers = users.map((user) => user.display_name);
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

export async function getTaskAssignmentOptions() {
  const supabase = await createClient();
  const orgId = await fetchOrgFromCurrentUser();
  

  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  if (orgMembersError) {
    console.error("org_members error:", orgMembersError);
    return { error: orgMembersError.message, roles: [], members: [] };
  }

  if (!orgMembers || orgMembers.length === 0) {
    console.error("No org members found for org:", orgId);
    return { error: "No org members found for this organization.", roles: [], members: [] };
  }

  const userIds = orgMembers.map((member) => member.user_id);
  console.log("org member user ids:", userIds);
   


  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("user_id, display_name")
    .in("user_id", userIds);

  if (usersError) {
    console.error("users table error:", usersError);
    return { error: usersError.message, roles: [], members: [] };
  }

  if (!users || users.length === 0) {
    console.error("No matching users found in users table for:", userIds);
    return { error: "No matching users found in users table.", roles: [], members: [] };
  }

  const roles = [...new Set(orgMembers.map((member) => member.role))];
  const members = users
    .map((user) => user.display_name)
    .filter((name): name is string => Boolean(name));

  console.log("roles found:", roles);
  console.log("members found:", members);

    //console.log("current orgId:", orgId);
//console.log("orgMembers for this org:", orgMembers);
//console.log("users returned:", users);

  return {
    error: null,
    roles,
    members,
  };
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

  if (!(await isValidAssignment(assignType, assignedTo))) {
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

  if (!(await isValidAssignment(assignType, assignedTo))) {
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