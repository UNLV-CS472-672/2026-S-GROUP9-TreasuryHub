"use server";

import { createClient } from "@/lib/supabase/server";

// List of fields required for an audit log entry
// This type checks to ensure the correct data is passed to the logAuditEntry function.
export type LogEntry = {
    orgId: string;
    userId: string;
    created_at?: Date | string;
    action: "CREATE" | "UPDATE" | "DELETE";
    entity_type: string;
    entity_id: string;
    before_data?: Record<string, any> | null;
    after_data?: Record<string, any> | null;
    type: "financial" | "account" | "file" | "system"; 
}

// Server action to log an audit entry
// Can be called from anywhere in the app to log important actions for auditing purposes
export async function logAuditEntry(entry: LogEntry) {
    const supabase = await createClient();

    const { data, error } = await supabase.from("audit_logs")
    .insert([
    {
        org_id: entry.orgId,
        user_id: entry.userId,
        created_at: entry.created_at ? new Date(entry.created_at) : new Date(),
        action: entry.action,
        entity: entry.entity_type,
        entity_id: entry.entity_id,
        before_data: entry.before_data ?? null,
        after_data: entry.after_data ?? null,
        type: entry.type,
    }
    ]);

    // This is outputted on the console for now for debugging. 
    if (error) {
        console.error("Failed to log audit entry:", error.message);
    }
    else {
        console.log("Audit entry logged successfully", data);
    }
}