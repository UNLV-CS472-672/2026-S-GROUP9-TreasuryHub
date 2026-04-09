"use server"; 

import { createClient } from "@/lib/supabase/server";

//Grabbing membership info
export async function getOrgMemberships() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Unauthorized", code: "unauthorized" };

    const { data: memberships, error: memberError } = await supabase
        .from("org_members")
        .select("org_id, role, organizations(org_name)")
        .eq("user_id", user.id)
        .in("role", ["treasurer", "advisor"]);

    if (memberError) return { error: memberError.message, code: "db_error" };
    if (!memberships || memberships.length === 0) return { error: "You are not a treasurer or advisor of any organization.", code: "no_org" };

    return { memberships };
}

//Grabbing transaction data to export as csv file
export async function exportCSV(orgId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Unauthorized", code: "unauthorized" };

    const { data: member, error: memberError } = await supabase
        .from("org_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .in("role", ["treasurer", "advisor"])
        .single();

    if (memberError || !member) return {
        error: "You do not have permission to export transactions for this organization.",
        code: "no_permission"
    };

    const { data: org } = await supabase
        .from("organizations")
        .select("org_name")
        .eq("org_id", orgId)
        .single();

    const { data, error } = await supabase
        .from("transactions")
        .select("*, date")
        .eq("org_id", orgId)
        .order("date", { ascending: false });

    if (error) return { error: error.message, code: "db_error" };
    if (!data || data.length === 0) return { error: "Your organization does not have any transactions to export.", code: "no_data" };

    return { data, orgName: org?.org_name ?? orgId };
}



