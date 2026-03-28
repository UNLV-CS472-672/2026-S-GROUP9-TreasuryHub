import { createClient } from "@/lib/supabase/server";

export type OrganizationMemberRole =
  | "member"
  | "executive"
  | "advisor"
  | "treasury_team"
  | "treasurer"
  | "admin";

export type OrganizationMembership = {
  user_id: string;
  org_id: string;
  role: OrganizationMemberRole;
};

export type OrganizationSummary = {
  org_id: string;
  org_name: string;
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
  users: OrganizationMemberUser | null;
};

type RawOrganizationMemberListItem = {
  user_id: string;
  org_id: string;
  role: OrganizationMemberRole;
  users: OrganizationMemberUser[] | null;
};

// For UC3, only treasurer and admin should be able to manage members.
// Keeping this in one helper makes the permission rule easy to reuse later.
export function canManageOrganizationMembers(role: string | null | undefined) {
  return role === "treasurer" || role === "admin";
}

export async function getCurrentUserWithOrganizationMembership(orgId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (user === null) {
    return {
      user: null,
      membership: null,
    };
  }

  const membershipResult = await supabase
    .from("org_members")
    .select("user_id, org_id, role")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  return {
    user,
    membership: membershipResult.data as OrganizationMembership | null,
  };
}

export async function getOrganizationById(orgId: string) {
  const supabase = await createClient();

  const result = await supabase
    .from("organizations")
    .select("org_id, org_name")
    .eq("org_id", orgId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data as OrganizationSummary | null;
}

export async function getOrganizationMembers(
  orgId: string
): Promise<OrganizationMemberListItem[]> {
  const supabase = await createClient();

  // Supabase gives the joined users relation back as an array here,
  // even though each org_members row should match one user.
  // So we normalize it into a single object to keep the page code cleaner.
  const { data: members, error } = await supabase
    .from("org_members")
    .select(
      `
        user_id,
        org_id,
        role,
        users (
          user_id,
          email,
          display_name
        )
      `
    )
    .eq("org_id", orgId)
    .order("role", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((members ?? []) as unknown) as RawOrganizationMemberListItem[];

  return rows.map((member) => ({
    user_id: member.user_id,
    org_id: member.org_id,
    role: member.role,
    users: member.users?.[0] ?? null,
  }));
}