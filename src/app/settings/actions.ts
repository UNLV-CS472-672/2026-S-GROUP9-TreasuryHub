"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isValidDisplayName, normalizeDisplayName } from "@/lib/profileValidation"

// Server action: updates the current user's display_name in public.users.
// Note: display_name lives on public.users (auto-created by handle_new_user
// trigger from auth.users metadata at registration time). We update it
// directly via RLS-protected update on public.users.
//
// Returns void to satisfy <form action={}> prop typing in Next.js.
// Validation failures and DB errors are silently ignored at the moment;
// follow-up work should add a toast or inline error indicator.
export async function updateDisplayName(formData: FormData): Promise<void> {
    const raw = formData.get("displayName")
    if (typeof raw !== "string") {
        return
    }

    const displayName = normalizeDisplayName(raw)

    if (!isValidDisplayName(displayName)) {
        return
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return
    }

    const { error } = await supabase
        .from("users")
        .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

    if (error) {
        console.error("updateDisplayName failed:", error.message)
        return
    }

    // Refresh the settings page so the new value shows up
    revalidatePath("/settings")
}