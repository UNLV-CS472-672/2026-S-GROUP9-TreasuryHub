"use server";

import { redirect } from "next/navigation";
import {
  canManageOrganizationMembers,
  getCurrentUserWithOrganizationMembership,
} from "@/lib/organizations";

export async function requireOrganizationMemberManagementAccess(orgId: string) {
  // This is the main guard for the members page.
  // PR 1 only needs read-only viewing for authorized managers,
  // but PR 2 can reuse this same check for mutations too.
  const { user, membership } = await getCurrentUserWithOrganizationMembership(
    orgId
  );

  // Not signed in at all -> send them to login.
  if (user === null) {
    redirect("/login");
  }

  // Signed in, but not part of this org -> send them away.
  if (membership === null) {
    redirect("/organizations");
  }

  // In the org, but wrong role for member management.
  if (!canManageOrganizationMembers(membership.role)) {
    redirect("/organizations");
  }

  return membership;
}
