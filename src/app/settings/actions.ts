"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isValidDisplayName, normalizeDisplayName } from "@/lib/profileValidation"

// Server action: updates the current user's display_name in public.users.
// Note: display_name lives on public.users (auto-created by handle_new_user
// trigger from auth.users metadata at registration time). We update it
// directly via RLS-protected update on public.users.
export async function updateDisplayName(formData: FormData) {
    const raw = formData.get("displayName")
    if (typeof raw !== "string") {
        return { error: "Invalid input" }
    }

    const displayName = normalizeDisplayName(raw)

    if (!isValidDisplayName(displayName)) {
        return { error: "Display name must be between 1 and 100 characters" }
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Not signed in" }
    }

    const { error } = await supabase
        .from("users")
        .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

    if (error) {
        return { error: error.message }
    }

    // Refresh the settings page so the new value shows up
    revalidatePath("/settings")
    return { ok: true }
}