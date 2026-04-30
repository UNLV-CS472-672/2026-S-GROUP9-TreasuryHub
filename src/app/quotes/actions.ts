"use server";

import { createClient } from "@/lib/supabase/server";
import { AuditLogType } from "../audit/lib/data";
import { logAuditEntry } from "../audit/lib/action";

export async function getQuotes(orgId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("org_id", orgId);

    if (error) {
        return { error: error.message };
    }
    return { data };
}

// Returns the current user's role in the given org, or null if not a member
export async function getCurrentUserRole(orgId: string): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    return data?.role ?? null;
}

// adds new quote to database
export async function addQuote(vendor: string, memo: string, amount: number, orgId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("quotes")
        .insert({
            vendor: vendor,
            memo: memo,
            amount: amount,
            org_id: orgId,
        })
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    if (!data) {
        return { error: "Quote was not created. You may not have permission to add quotes." };
    }

    // Grab the role of the current user of the current organization
    const { data: roleData, error: roleError } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", data.uploaded_by)
        .single();

    if (roleError) {
        console.error("Failed to fetch user's role.");
        return { error: roleError.message };
    }

    await logAuditEntry({
        orgId: orgId,
        userId: data.uploaded_by,
        action: "CREATE",
        entity_type: "quote",
        entity_id: data.quotes_id,
        before_data: null,
        after_data: {
            "Vendor": data.vendor,
            "Memo": data.memo,
            "Amount": data.amount,
            "STATUS": "PENDING",
        },
        type: AuditLogType.FINANCIAL,
        display_role: roleData?.role,
    });

    return { data };
}

// marks as accepted
export async function acceptQuote(id: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("quotes")
        .update({ accepted: true })
        .eq("quotes_id", id)
        .select()
        .single();

    if (error) {
        return { error: error.message };
    }

    if (!data) {
        return { error: "Quote was not updated. You may not have permission to accept this quote." };
    }

    // Grabs the role of the current user of the current organization
    const { data: roleData, error: roleError } = await supabase
        .from("org_members")
        .select("role")
        .eq("user_id", data.uploaded_by)
        .eq("org_id", data.org_id)
        .single();

    if (roleError) {
        console.error("Failed to fetch user's role.");
    }

    await logAuditEntry({
        orgId: data.org_id,
        userId: data.uploaded_by,
        action: "UPDATE",
        entity_type: "quote",
        entity_id: data.quotes_id,
        before_data: { "STATUS": "PENDING" },
        after_data: { "STATUS": "ACCEPTED" },
        type: AuditLogType.FINANCIAL,
        display_role: roleData?.role,
    });

    return { data };
}

// deleting quotes
export async function deleteQuote(id: number) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "User must be authenticated to delete quotes." };
    }

    const { data: beforeData, error: beforeError } = await supabase
        .from("quotes")
        .select()
        .eq("quotes_id", id)
        .single();

    if (beforeError || !beforeData) {
        return { error: "Unable to fetch quote (it may not exist or you may not have access)." };
    }

    // Use .select() to confirm rows actually got deleted
    const { data: deletedRows, error } = await supabase
        .from("quotes")
        .delete()
        .eq("quotes_id", id)
        .select();

    if (error) {
        return { error: error.message };
    }

    if (!deletedRows || deletedRows.length === 0) {
        return { error: "Quote was not deleted. You may not have permission to delete this quote." };
    }

    // Grab the role of the user of the current organization
    const { data: roleData, error: roleError } = await supabase
        .from("org_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", beforeData.org_id)
        .single();

    if (roleError) {
        console.error("Failed to fetch user's role.");
        return { error: roleError.message };
    }

    await logAuditEntry({
        orgId: beforeData.org_id,
        userId: user.id,
        action: "DELETE",
        entity_type: "quote",
        entity_id: beforeData.quotes_id,
        before_data: {
            "Vendor": beforeData.vendor,
            "Memo": beforeData.memo,
            "Amount": beforeData.amount,
            "STATUS": beforeData.accepted ? "ACCEPTED" : "PENDING",
        },
        after_data: null,
        type: AuditLogType.FINANCIAL,
        display_role: roleData.role,
    });

    return { data: deletedRows[0] };
}