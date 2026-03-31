"use client";

import { useState, useEffect } from "react";
import { getOrgMemberships, exportCSV } from "./action";
import BackButton from "@/components/BackButton";

//Storing membership information
type Membership = {
    org_id: string;
    role: string;
    organizations: { org_name: string } | { org_name: string }[] | null;
};

//exporting csv file
export default function CSVPage( ) {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>("");
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [noOrg, setNoOrg] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMemberships = async () => {
            const result = await getOrgMemberships();
            if ('error' in result) {
                if (result.code === "no_org") {
                    setNoOrg(true);
                } else {
                    setFetchError(result.error ?? "An error occurred while fetching memberships.");
                }
            } else {
                setMemberships(result.memberships as Membership[]);
                if (result.memberships.length === 1) {
                    setSelectedOrgId(result.memberships[0].org_id);
                }
            }
            setLoading(false);
        };
        fetchMemberships();
    }, []);
    
    const handleExport = async () => {
        setPermissionError(null);
        setExportError(null);

         const result = await exportCSV(selectedOrgId);
        if ('error' in result) {
            if (result.code === "no_permission") {
                setPermissionError(result.error ?? "You do not have permission to export.");
            } else {
                setExportError(result.error ?? "An error occurred during export.");
            }
            return;
        }

        const { data, orgName } = result;
        const safeName = orgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

        const escapeCell = (value: unknown): string => {
            if (value === null || value === undefined) return "";
            const str = String(value);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

    //exporting file to csv format
    const headers = Object.keys(data[0]).map(escapeCell).join(",");
        const rows = data.map(row =>
            Object.values(row).map(escapeCell).join(",")
        ).join("\n");
        const csv = `${headers}\n${rows}`;

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_transactions.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <p className="p-4">Loading...</p>;

        //If user is not a treasurer or advisor of any organization, show message
        if (noOrg) return (
            <div className="p-4 space-y-2">
                <h1 className="text-xl font-semibold">Exporting Transactions into CSV File</h1>
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
                    <p className="font-medium">No organization found</p>
                    <p className="text-sm">You must be a treasurer or advisor of an organization to export transactions.</p>
                </div>
            </div>
        );

    //Page output
    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Exporting Transactions into CSV File</h1>

            {fetchError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                    <p className="font-medium">Failed to load organizations</p>
                    <p className="text-sm">{fetchError}</p>
                </div>
            )}

            {permissionError && (
                <div className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-3 rounded">
                    <p className="font-medium">Permission Denied</p>
                    <p className="text-sm">{permissionError}</p>
                </div>
            )}

            {exportError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                    <p className="font-medium">Export Failed</p>
                    <p className="text-sm">{exportError}</p>
                </div>
            )}

            {memberships.length > 1 && (
                <div>
                    <label className="block text-sm font-medium mb-1">Select Organization</label>
                    <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="border rounded px-3 py-2 w-64"
                    >
                        <option value="" disabled>Select an organization...</option>
                        {memberships.map((m) => {
                            const orgName = Array.isArray(m.organizations)
                                ? m.organizations[0]?.org_name
                                : m.organizations?.org_name;
                            return (
                                <option key={m.org_id} value={m.org_id}>
                                    {orgName ?? m.org_id}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}
            <div className="flex items-center gap-4">
            <button onClick={handleExport}
                disabled={!selectedOrgId}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition-all">
                Export Transactions
            </button>
            <BackButton />
            </div>
        </div>
    );
}