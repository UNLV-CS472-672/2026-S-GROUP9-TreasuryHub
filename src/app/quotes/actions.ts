"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getQuotes(eventId: number){
    const supabase = await createClient();

    const {data, error} = await supabase
        .from("quotes")
        .select("*")
        .eq("event_id", eventId)

    if(error){
        return { error: error.message };
    }
    return {data};
}

// adds new quote to database
export async function addQuote(eventId: number, vendor: string, memo: string, amount: number){
    const supabase = await createClient();
    const {error} = await supabase
        .from("quotes")
        .insert({event_id: eventId, vendor, memo, amount, accepted: false});
        
    if(error){
        return { error: error.message };
    }
}

// marks as accepted
export async function acceptQuote(id: number) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("quotes")
        .update({ accepted: true })
        .eq("id", id);
    if (error){
        return { error: error.message };
    }
}