"use server";

import { createClient } from "@/lib/supabase/server";

export async function getQuotes(){
    const supabase = await createClient();

    const {data, error} = await supabase
        .from("quotes")
        .select("*")

    if(error){
        return { error: error.message };
    }
    return {data};
}

// adds new quote to database
export async function addQuote(vendor: string, memo: string, amount: number){
    const supabase = await createClient();

    console.log("Attempting insert with:", { vendor, memo, amount })

    const {data, error} = await supabase.from("quotes")
    
        .insert({
            vendor: vendor,
            memo: memo,
            amount: amount,
        })
        .select()
        
    console.log("Result:", { data, error })

    if(error){
        return { error: error.message };
    }
    return { data }
}

// marks as accepted
export async function acceptQuote(id: number) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("quotes")
        .update({ accepted: true })
        .eq("quotes_id", id);
    if (error){
        return { error: error.message };
    }
}

// deleting quotes
export async function deleteQuote(id: number){
    const supabase = await createClient();
    const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("quotes_id", id); // check id
    if(error){
        return {
            error: error.message };
        }
    }