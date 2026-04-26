"use server";

import { logAuditEntry } from "../audit/lib/action";
import { getAuditTaskType } from "../audit/lib/data";
import {
  canManageTasks,
  isOrganizationRole,
  type OrganizationRole,
} from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

type TaskAssignType = "role" | "individual";

type OrgMembership = {
  user_id: string;
  org_id: string;
  role: string;
};

type TaskPermissionContext = {
  userId: string;
  orgId: string;
  role: string;
};

const validTaskTypes = [
  "TODO",
  "EVENT",
  "INVOICE",
  "PAYROLL",
  "PAYMENT",
  "FUNDRAISER",
  "MEETING",
] as const;

function isValidFutureDate(dateString?: string) {
  if (!dateString) return true;

  const selectedDate = new Date(dateString);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);

  return selectedDate > today;
}

async function getAuthenticatedUserId(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

async function getMembershipForOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string
): Promise<TaskPermissionContext | null> {
  const userId = await getAuthenticatedUserId(supabase);

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("org_members")
    .select("user_id, org_id, role")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const membership = data as OrgMembership;

  return {
    userId,
    orgId: membership.org_id,
    role: membership.role,
  };
}

async function requireTaskManagementAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string
) {
  const membership = await getMembershipForOrg(supabase, orgId);

  if (!membership || !canManageTasks(membership.role)) {
    return null;
  }

  return membership;
}

async function isValidAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  assignType: TaskAssignType,
  assignedTo: string
) {
  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  if (orgMembersError || !orgMembers) {
    return false;
  }

  if (assignType === "role") {
    if (!isOrganizationRole(assignedTo)) {
      return false;
    }

    const validRoles = [
      ...new Set(
        orgMembers
          .map((member) => member.role)
          .filter((role): role is OrganizationRole => isOrganizationRole(role))
      ),
    ];

    return validRoles.includes(assignedTo);
  }

  if (assignType === "individual") {
    const userIds = orgMembers.map((member) => member.user_id);

    if (userIds.length === 0) {
      return false;
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (usersError || !users) {
      return false;
    }

    const validMembers = users
      .map((user) => user.display_name)
      .filter((name): name is string => Boolean(name));

    return validMembers.includes(assignedTo);
  }

  return false;
}


// get all tasks for the active organization
export async function getTasks(orgId: string) {
  const supabase = await createClient();
  const membership = await getMembershipForOrg(supabase, orgId);

  if (!membership) {
    return { error: "You do not have access to this organization.", data: [] };
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { error: null, data: data ?? [] };
}

export async function getTaskAssignmentOptions(orgId: string) {
  const supabase = await createClient();
  const membership = await getMembershipForOrg(supabase, orgId);

  if (!membership) {
    return {
      error: "You do not have access to this organization.",
      roles: [],
      members: [],
      currentUserRole: null,
      canManage: false,
    };
  }

  const { data: orgMembers, error: orgMembersError } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId);

  if (orgMembersError) {
    console.error("org_members error:", orgMembersError);
    return {
      error: orgMembersError.message,
      roles: [],
      members: [],
      currentUserRole: membership.role,
      canManage: canManageTasks(membership.role),
    };
  }

  if (!orgMembers || orgMembers.length === 0) {
    console.error("No org members found for org:", orgId);
    return {
      error: "No org members found for this organization.",
      roles: [],
      members: [],
      currentUserRole: membership.role,
      canManage: canManageTasks(membership.role),
    };
  }

  const userIds = orgMembers.map((member) => member.user_id);

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("user_id, display_name")
    .in("user_id", userIds);

  if (usersError) {
    console.error("users table error:", usersError);
    return {
      error: usersError.message,
      roles: [],
      members: [],
      currentUserRole: membership.role,
      canManage: canManageTasks(membership.role),
    };
  }

  if (!users || users.length === 0) {
    console.error("No matching users found in users table for:", userIds);
    return {
      error: "No matching users found in users table.",
      roles: [],
      members: [],
      currentUserRole: membership.role,
      canManage: canManageTasks(membership.role),
    };
  }

  const roles = [
    ...new Set(
      orgMembers
        .map((member) => member.role)
        .filter((role): role is OrganizationRole => isOrganizationRole(role))
    ),
  ];

  const members = users
    .map((user) => user.display_name)
    .filter((name): name is string => Boolean(name));

  return {
    error: null,
    roles,
    members,
    currentUserRole: membership.role,
    canManage: canManageTasks(membership.role),
  };
}

// create task
export async function addTaskAction(formData: {
  title: string;
  taskType: string;
  assignType: TaskAssignType;
  assignedTo: string;
  dueDate?: string;
  orgId: string;
}) {
  const { title, taskType, assignType, assignedTo, dueDate, orgId } = formData;
  const supabase = await createClient();
  const membership = await requireTaskManagementAccess(supabase, orgId);

  if (!membership) {
    return { error: "You do not have permission to create tasks." };
  }

  if (!title.trim()) {
    return { error: "Task title is required." };
  }

  if (!validTaskTypes.includes(taskType as (typeof validTaskTypes)[number])) {
    return { error: "Invalid task type." };
  }

  if (!assignedTo) {
    return { error: "Please assign the task to a role or individual." };
  }

  if (!(await isValidAssignment(supabase, orgId, assignType, assignedTo))) {
    return { error: "Task must be assigned to an existing role or member." };
  }

  if (!isValidFutureDate(dueDate)) {
    return { error: "Due date must be a valid future date." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        title: title.trim(),
        task_type: taskType,
        assign_type: assignType,
        assigned_to: assignedTo,
        due_date: dueDate || null,
        org_id: orgId,
        notify_days_before: 3,
      },
    ])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAuditEntry({
    orgId,
    userId: membership.userId,
    action: "CREATE",
    entity_type: "task",
    entity_id: data.id,
    before_data: null,
    after_data: {
      "Task Name": title.trim(),
      "Task Type": taskType,
      "User Assigned": assignedTo,
      "Due Date": dueDate,
    },
    type: getAuditTaskType(taskType),
    display_role: membership.role,
  });

  return { error: null };
}

// edit task
export async function updateTaskAction(
  id: number,
  formData: {
    title: string;
    taskType: string;
    assignType: TaskAssignType;
    assignedTo: string;
    dueDate?: string;
    orgId: string;
  }
) {
  const { title, taskType, assignType, assignedTo, dueDate, orgId } = formData;
  const supabase = await createClient();
  const membership = await requireTaskManagementAccess(supabase, orgId);

  if (!membership) {
    return { error: "You do not have permission to edit tasks." };
  }

  if (!title.trim()) {
    return { error: "Task title is required." };
  }

  if (!validTaskTypes.includes(taskType as (typeof validTaskTypes)[number])) {
    return { error: "Invalid task type." };
  }

  if (!assignedTo) {
    return { error: "Please assign the task to a role or individual." };
  }

  if (!(await isValidAssignment(supabase, orgId, assignType, assignedTo))) {
    return { error: "Task must be assigned to an existing role or member." };
  }

  if (!isValidFutureDate(dueDate)) {
    return { error: "Due date must be a valid future date." };
  }

  // Grab the current data before the update for audit logging.
  const { data: beforeData, error: beforeError } = await supabase
    .from("tasks")
    .select()
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (beforeError || !beforeData) {
    return { error: beforeError?.message ?? "Task not found." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      task_type: taskType,
      assign_type: assignType,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      org_id: orgId,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await logAuditEntry({
    orgId,
    userId: membership.userId,
    action: "UPDATE",
    entity_type: "task",
    entity_id: data.id,
    before_data: {
      "Task Name": beforeData.title,
      "Task Type": beforeData.task_type,
      "User Assigned": beforeData.assigned_to,
      "Due Date": beforeData.due_date,
    },
    after_data: {
      "Task Name": title.trim(),
      "Task Type": taskType,
      "User Assigned": assignedTo,
      "Due Date": dueDate,
    },
    type: getAuditTaskType(taskType),
    display_role: membership.role,
  });

  return { error: null };
}

// delete task
export async function deleteTaskAction(id: number, orgId: string) {
  const supabase = await createClient();
  const membership = await requireTaskManagementAccess(supabase, orgId);

  if (!membership) {
    return { error: "You do not have permission to delete tasks." };
  }

  // Grab the current data before deleting, used for audit logging.
  const { data: beforeData, error: beforeError } = await supabase
    .from("tasks")
    .select()
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (beforeError || !beforeData) {
    return { error: beforeError?.message ?? "Task not found." };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEntry({
    orgId,
    userId: membership.userId,
    action: "DELETE",
    entity_type: "task",
    entity_id: beforeData.id,
    before_data: {
      "Task Name": beforeData.title,
      "Task Type": beforeData.task_type,
      "User Assigned": beforeData.assigned_to,
      "Due Date": beforeData.due_date,
    },
    after_data: null,
    type: getAuditTaskType(beforeData.task_type),
    display_role: membership.role,
  });

  return { error: null };
}