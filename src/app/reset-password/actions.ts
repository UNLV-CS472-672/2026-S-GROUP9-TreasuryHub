"use server"

import { createClient } from "@/lib/supabase/server"
import { isValidPassword } from "@/lib/authValidation"

// Server action: updates the password for the currently-authenticated user.
// At this point the user has clicked the recovery link in their email,
// so they have a temporary recovery session. We update the password and
// then sign them out so they have to log in fresh.
export async function updatePassword(newPassword: string) {
    if (!isValidPassword(newPassword)) {
        return { error: "Password must be at least 8 characters" }
    }

    const supabase = await createClient()

    // Confirm there's an active session before trying to update.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "No active reset session. Please request a new reset link." }
    }

    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (updateError) {
        return { error: updateError.message }
    }

    // Sign the user out so they have to log in with the new password.
    // Otherwise the recovery session would let them stay in indefinitely.
    await supabase.auth.signOut()

    return { ok: true }
}