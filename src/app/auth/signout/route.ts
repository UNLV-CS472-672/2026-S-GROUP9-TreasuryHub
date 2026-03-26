import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
   // create supabase client
   const supabase = await createClient();

   await supabase.auth.signOut();

   return NextResponse.redirect(new URL("/login", request.url));

}