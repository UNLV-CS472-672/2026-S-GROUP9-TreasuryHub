import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

// Handles the redirect from Supabase auth emails (signup confirmation,
// password recovery, magic links). The link in the email contains a `code`
// query param; we exchange that code for a session, then redirect the user
// to wherever the `next` param says (or home).
//
// Used by:
//   - UC1 email confirmation (?next=/)
//   - Password reset (?next=/reset-password)
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/"

    if (!code) {
        // No code = bad link. Send them to login with a generic error
        // rather than leaking what specifically went wrong.
        return NextResponse.redirect(`${origin}/login?error=invalid_link`)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=invalid_link`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}