import { createClient } from "@/lib/supabase/server";
import {
  ORGANIZATION_ROLES,
  canManageMembers,
  isOrganizationRole,
  type OrganizationRole,
} from "@/lib/roles";

// Re-exporting the shared role source keeps older imports working while
// moving the actual role ownership into src/lib/roles.ts.
export const ORGANIZATION_MEMBER_ROLE_OPTIONS = ORGANIZATION_ROLES;

export type OrganizationMemberRole = OrganizationRole;

export type OrganizationMembership = {
  user_id: string;
  org_id: string;
  role: OrganizationMemberRole;
};

export type OrganizationSummary = {
  org_id: string;
  org_name: string;
  logo_path: string | null; // to show logo
};

export type OrganizationMemberUser = {
  user_id: string;
  email: string;
  display_name: string | null;
};

export type OrganizationMemberListItem = {
  user_id: string;
  org_id: string;
  role: OrganizationMemberRole;
  user: OrganizationMemberUser | null;
};

// For UC3, only treasurers and admins are supposed to manage members.
export function canManageOrganizationMembers(role: string | null | undefined) {
  return canManageMembers(role);
}

// Basic role validation so the server does not trust whatever comes from the form.
export function isOrganizationMemberRole(
  value: string | null | undefined
): value is OrganizationMemberRole {
  return isOrganizationRole(value);
}

// Normalizing email avoids dumb mismatches like uppercase letters or spaces.
export function normalizeMemberEmail(email: string) {
  return email.trim().toLowerCase();
}

// Gets the logged-in user and also checks whether they belong to this org.
export async function getCurrentUserWithOrganizationMembership(orgId: string) {
  //Creates Supabase client
  const supabase = await createClient();

  //Authenticates the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  //Error if authentication fails
  if (userError) {
    throw new Error(userError.message);
  }

  // If no auth user exists, just return null values and let caller decide what to do.
  if (user === null) {
    return {
      user: null,
      membership: null,
    };
  }

  //Checks if member is part of the organization
  const membershipResult = await supabase
    .from("org_members")
    .select("user_id, org_id, role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();

  //Error if member organization check fails
  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  //Returns user and what their organizations are
  return {
    user,
    membership: membershipResult.data as OrganizationMembership | null,
  };
}

// Small helper for getting the org name/header info.
export async function getOrganizationById(orgId: string) {
  const supabase = await createClient();

  const result = await supabase
    .from("organizations")
    .select("org_id, org_name, logo_path")
    .eq("org_id", orgId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data as OrganizationSummary | null;
}

// Looks up an existing app user by email, scoped to a specific organization.
// Uses the find_user_by_email_for_org RPC which runs as SECURITY DEFINER
// to bypass RLS on the users table — required because the caller may not
// share an org with the target user yet (e.g. when re-adding a removed member).
// The RPC itself enforces that only treasurer/admin of the target org can
// perform the lookup.
export async function getUserByEmailForOrg(email: string, orgId: string) {
  const supabase = await createClient();

  const result = await supabase
    .rpc("find_user_by_email_for_org", {
      target_email: email,
      target_org: orgId,
    });

  if (result.error) {
    throw new Error(result.error.message);
  }

  // RPC returns an array; we want the first match or null.
  const rows = (result.data as OrganizationMemberUser[] | null) ?? [];
  return rows[0] ?? null;
}

// Gets all org_members rows for this org, then separately loads the users.
// This is simpler/more reliable than relying on a nested join shape.
// It should also help with the "Unknown User" issue from PR1.
export async function getOrganizationMembers(
  orgId: string
): Promise<OrganizationMemberListItem[]> {
  const supabase = await createClient();

  const membershipResult = await supabase
    .from("org_members")
    .select("user_id, org_id, role")
    .eq("org_id", orgId)
    .order("role", { ascending: true });

  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  const memberships =
    (membershipResult.data as OrganizationMembership[] | null) ?? [];

  if (memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map((membership) => membership.user_id);

  const usersResult = await supabase
    .from("users")
    .select("user_id, email, display_name")
    .in("user_id", userIds);

  if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }

  const users = (usersResult.data as OrganizationMemberUser[] | null) ?? [];
  const userMap = new Map(users.map((user) => [user.user_id, user]));

  return memberships.map((membership) => ({
    user_id: membership.user_id,
    org_id: membership.org_id,
    role: membership.role,
    user: userMap.get(membership.user_id) ?? null,
  }));
}