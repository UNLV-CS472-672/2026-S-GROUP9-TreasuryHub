"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canManageOrganizationMembers,
  getCurrentUserWithOrganizationMembership,
  getUserByEmailForOrg,
  isOrganizationMemberRole,
  normalizeMemberEmail,
} from "@/lib/organizations";
import { logAuditEntry } from "@/app/audit/lib/action";
import { AuditLogType } from "@/app/audit/lib/data";

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
  const user = await getUserByEmailForOrg(email, orgId);


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

  // Fetch the organization name for the audit log entry.
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .select("org_name")
    .eq("org_id", orgId)
    .maybeSingle();

  if (orgError) {
    console.error(
      "Failed to fetch organization data for audit log:",
      orgError.message
    );
  }

  // Fetch the new member's display name for the audit log entry.
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("display_name")
    .eq("user_id", user.user_id)
    .maybeSingle();

  if (userError) {
    console.error(
      "Failed to fetch new user data for audit log:",
      userError.message
    );
  }

  // Fetch current user ID
  const { data: userID } = await supabase.auth.getUser()

  if (!userID.user) {
    console.error("Failed to fetch current user ID.");
    return;
  }

  // Fetch the current user's role
  const { data: roleData, error: roleError } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userID.user.id)
    .eq('org_id', orgId)
    .maybeSingle()

  if (roleError) {
    console.error(
      "Failed to fetch user role for audit log:",
      roleError.message
    );
  }

  // Log the new member addition in the audit log
  await logAuditEntry({
    orgId: orgId,
    userId: userID.user.id,
    action: "CREATE",
    entity_type: "organization_member",
    entity_id: user.user_id,
    after_data: { "Organization": orgData?.org_name, "User": userData?.display_name, "User ID": user.user_id, "Role": role },
    type: AuditLogType.ACCOUNT,
    display_role: roleData?.role,
  });

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

// Updates an existing member role inside the org.
// The authorization check is server-side so the UI is not trusted.
export async function updateOrganizationMemberRole(
  orgId: string,
  formData: FormData
) {
  const currentMembership =
    await requireOrganizationMemberManagementAccess(orgId);

  const targetUserId = String(formData.get("userId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "");

  if (!targetUserId) {
    redirect(buildMembersPageRedirect(orgId, "error", "Missing member id."));
  }

  if (!isOrganizationMemberRole(nextRole)) {
    redirect(buildMembersPageRedirect(orgId, "error", "Invalid role."));
  }

  // Keeping this simple/safe for PR3: do not let managers accidentally
  // remove their own management access from the same page.
  if (targetUserId === currentMembership.user_id) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "You cannot change your own role from this page."
      )
    );
  }

  const supabase = await createClient();

  const existingMembershipResult = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (existingMembershipResult.error) {
    throw new Error(existingMembershipResult.error.message);
  }

  if (existingMembershipResult.data === null) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "That member no longer belongs to this organization."
      )
    );
  }

  if (existingMembershipResult.data.role === nextRole) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "success",
        `No change was needed. Role is already ${nextRole.replaceAll("_", " ")}.`
      )
    );
  }

  const updateResult = await supabase
    .from("org_members")
    .update({ role: nextRole })
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);

  if (updateResult.error) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        `Failed to update member role: ${updateResult.error.message}`
      )
    );
  }

  console.log("User ID being updated:", targetUserId);

  // Fetch the member's display name for the audit log entry
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("display_name")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (userError) {
    console.error(
      "Failed to fetch user data for audit log:",
      userError.message
    );
  }

  console.log("User Display Name:", userData?.display_name);

  // Log the member role update in the audit log
  await logAuditEntry({
    orgId: orgId,
    userId: currentMembership.user_id,
    action: "UPDATE",
    entity_type: "organization_member",
    entity_id: targetUserId,
    before_data: { "User": userData?.display_name, "User ID": targetUserId, "Role": existingMembershipResult.data.role },
    after_data: { "User": userData?.display_name, "User ID": targetUserId, "Role": nextRole },
    type: AuditLogType.ACCOUNT,
    display_role: currentMembership.role,
  });

  revalidatePath(`/organizations/${orgId}/members`);
  revalidatePath("/organizations");

  redirect(
    buildMembersPageRedirect(
      orgId,
      "success",
      `Member role updated to ${nextRole.replaceAll("_", " ")}.`
    )
  );
}

// Removes a member from the organization.
// The removed user loses access on their next request because all protected
// page loads and actions do a fresh membership lookup.
export async function removeOrganizationMember(
  orgId: string,
  formData: FormData
) {
  const currentMembership =
    await requireOrganizationMemberManagementAccess(orgId);

  const targetUserId = String(formData.get("userId") ?? "").trim();

  if (!targetUserId) {
    redirect(buildMembersPageRedirect(orgId, "error", "Missing member id."));
  }

  if (targetUserId === currentMembership.user_id) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "You cannot remove yourself from this page."
      )
    );
  }

  const supabase = await createClient();

  const existingMembershipResult = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (existingMembershipResult.error) {
    throw new Error(existingMembershipResult.error.message);
  }

  if (existingMembershipResult.data === null) {
    redirect(
      buildMembersPageRedirect(
        orgId,
        "error",
        "That member no longer belongs to this organization."
      )
    );
  }

  const deleteResult = await supabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", targetUserId);

  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  // Fetch the member's display name for the audit log entry
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("display_name")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (userError) {
    console.error(
      "Failed to fetch user data for audit log:",
      userError.message
    );
  }

  // Log the member removal in the audit log
  await logAuditEntry({
    orgId: orgId,
    userId: currentMembership.user_id,
    action: "DELETE",
    entity_type: "organization_member",
    entity_id: targetUserId,
    before_data: { "User": userData?.display_name, "User ID": targetUserId },
    type: AuditLogType.ACCOUNT,
    display_role: currentMembership.role,
  });

  revalidatePath(`/organizations/${orgId}/members`);
  revalidatePath("/organizations");

  redirect(
    buildMembersPageRedirect(orgId, "success", "Member removed from organization.")
  );
}