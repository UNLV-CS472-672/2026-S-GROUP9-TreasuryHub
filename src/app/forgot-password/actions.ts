"use server"

import { createClient } from "@/lib/supabase/server"
import { isValidEmail } from "@/lib/authValidation"

// Server action: triggers Supabase to send a password reset email.
// The link in that email points back to /auth/callback?type=recovery
// which then redirects the user to /reset-password where they set a new one.
export async function requestPasswordReset(email: string) {
    if (!isValidEmail(email)) {
        return { error: "Invalid email format" }
    }

    const supabase = await createClient()

    // The redirectTo URL must be added to Supabase Dashboard
    // → Authentication → URL Configuration → Redirect URLs
    // We read the site URL from env so it works in dev and prod.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
        // Don't surface the underlying error to the client
        // since it could leak whether the email exists.
        // Page-level UI shows a generic success message either way.
        return { error: error.message }
    }

    return { ok: true }
}