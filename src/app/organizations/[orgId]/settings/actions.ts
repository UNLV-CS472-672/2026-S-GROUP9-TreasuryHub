"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type UpdateOrgLogoParams = {
  orgId: string;
};

export async function updateOrganizationLogo(
  params: UpdateOrgLogoParams,
  formData: FormData
) {
  const supabase = await createClient();
  const { orgId } = params;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  const allowedRoles = ["treasurer", "advisor", "executive", "admin"];
  if (!membership || !allowedRoles.includes(membership.role.toLowerCase())) {
    throw new Error("No permission");
  }

  const file = formData.get("logo") as File | null;

  if (!file || file.size === 0) {
    throw new Error("No file");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const filePath = `${orgId}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("organization-logos")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  // STORE PATH ONLY
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_path: filePath }) // <-- THIS is key
    .eq("org_id", orgId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/organizations/${orgId}/settings`);

  redirect(`/dashboard?orgId=${orgId}`);
}