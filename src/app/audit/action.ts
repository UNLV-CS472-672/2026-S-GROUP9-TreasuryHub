"use server";

import { createClient } from "@/lib/supabase/server";

// List of fields required for an audit log entry
// This type checks that the correct data is passed to the logAuditEntry function.
export type LogEntry = {
    orgId: string;
    userId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entity: string;
    before_data?: any;
    after_data?: any;
}

// Server action to log an audit entry
// Can be called from anywhere in the app to log important actions for auditing purposes
export async function logAuditEntry(entry: LogEntry){
    const supabase = await createClient();

    const { data, error } = await supabase.from("audit_logs")
    .insert([
    {
        org_id: entry.orgId,
        user_id: entry.userId,
        action: entry.action,
        entity: entry.entity,
        before_data: entry.before_data || null,
        after_data: entry.after_data || null,
    }
    ]);

    // This is outputted on the console for now for debugging. 
    if(error) {
        console.error("Failed to log audit entry:", error.message);
    }
    else {
        console.log("Audit entry logged successfully", data);
    }
}