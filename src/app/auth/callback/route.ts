// Handles the OAuth/email confirmation callback from Supabase
// Exchanges the temporary auth code for a session
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Auth successful, send user to the main app
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Auth failed, send back to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}