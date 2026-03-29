"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canManageOrganizationMembers,
  getCurrentUserWithOrganizationMembership,
  getUserByEmail,
  isOrganizationMemberRole,
  normalizeMemberEmail,
} from "@/lib/organizations";

// Just a small helper so redirects stay consistent and readable.
function buildMembersPageRedirect(
  orgId: string,
  type: "success" | "error",
  message: string
) {
  const params = new URLSearchParams({ [type]: message });
  return `/organizations/${orgId}/members?${params.toString()}`;
}

// This keeps the manager check on the server.
// Even if someone messes with the UI, this still protects the action.
export async function requireOrganizationMemberManagementAccess(orgId: string) {
  const { user, membership } = await getCurrentUserWithOrganizationMembership(
    orgId
  );

  if (user === null) {
    redirect("/login");
  }

  if (membership === null) {
    redirect("/organizations?error=You+are+not+part+of+that+organization.");
  }

  if (!canManageOrganizationMembers(membership.role)) {
    redirect(
      "/organizations?error=You+do+not+have+permission+to+manage+members."
    );
  }

  return membership;
}

// Server action for adding an existing user to an org.
export async function addOrganizationMember(orgId: string, formData: FormData) {
  await requireOrganizationMemberManagementAccess(orgId);

  // Pull the raw values out of the form.
  const email = normalizeMemberEmail(String(formData.get("email") ?? ""));
  const role = String(formData.get("role") ?? "");

  // Very basic validation. Keeping it simple on purpose.
  if (!email) {
    redirect(
      buildMembersPageRedirect(orgId, "error", "Enter an email address.")
    );
  }

  // Never trust the form role value blindly.
  if (!isOrganizationMemberRole(role)) {
    redirect(buildMembersPageRedirect(orgId, "error", "Invalid role."));
  }

  // PR2 only adds users that already exist in public.users.
  const user = await getUserByEmail(email);

  if (user === null) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "No user with that email was found."
      )
    );
  }

  const supabase = await createClient();

  // Check if that user is already in this org so we do not create duplicates.
  const existingMembershipResult = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", user.user_id)
    .maybeSingle();

  if (existingMembershipResult.error) {
    throw new Error(existingMembershipResult.error.message);
  }

  if (existingMembershipResult.data !== null) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "That user is already a member of this organization."
      )
    );
  }

  // Insert the new membership row.
  const insertResult = await supabase.from("org_members").insert({
    org_id: orgId,
    user_id: user.user_id,
    role,
  });

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }

  // Refresh the page data after a successful insert.
  revalidatePath(`/organizations/${orgId}/members`);
  revalidatePath("/organizations");

  redirect(
    buildMembersPageRedirect(
      orgId,
      "success",
      `${user.email} was added as ${role.replaceAll("_", " ")}.`
    )
  );
}