"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Server action for registration
// Called from the client form, runs on the server

export async function signUp(email:string, password:string) {
    const supabase = await createClient();

    const {error} = await supabase.auth.signUp({
        email,
        password,
    });

    if(error) {
        // Return the error message to the client for display
        return { error: error.message };
    }

    //Registration successful, redirect to home for now
    // (will be org selection screen later)
    redirect("/");
}