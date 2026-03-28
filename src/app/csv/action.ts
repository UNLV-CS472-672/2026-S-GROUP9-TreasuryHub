"use server"; 

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function exportCSV(organizationId: string) {
    const supabase = await createClient();

    const {data, error} = await supabase
        .from("transactions")
        .select()
        .eq("org_id", organizationId);

    if(error) {
        return { error: error.message };
    }

    return { data };
}

const handleExport = async (organizationId: string) => {
    const result = await exportCSV(organizationId);
    if ('error' in result) return;
    const data = result.data;
    if (!data) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
};
