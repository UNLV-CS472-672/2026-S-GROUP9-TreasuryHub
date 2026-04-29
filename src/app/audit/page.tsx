"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { canViewAudit, getAuditVisibilityScope } from "@/lib/roles";
import { AuditLogType } from "./lib/data";
import { formatAction } from "./lib/render";
import {
  renderAuditDetails,
  formatDisplayRole,
  cellClass,
  headerClass,
  containerClass,
  tableClass,
  formatEntity,
} from "./lib/render";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "next/navigation";
import OrgDropDown from "@/components/OrgDropDown";
import { Skeleton } from '@/components/Skeleton'

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AuditPage
// Responsibilities:
// - Fetch the current user and their organization
// - Query audit logs for transactions within the organization
// - Determine each user's role for display
// - Render the audit data in a structured table

type OrgOption = {
    org_id: string;
    org_name: string;
    role: string;
}

function AuditPageContent() {
    const searchParams = useSearchParams();
    const orgIdFromParams = searchParams.get("orgId");


    const [orgId, setOrgId] = useState<string | null>(orgIdFromParams);
    const [organizations, setOrganizations] = useState<OrgOption[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the current user's ID, organizations and role

    useEffect(() => {
        const fetchUserandOrgs = async () => {

            // Fetch the user id
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error("Error fetching user:", userError);
                return;
            }

            if (!user) {
                console.warn("No user is currently logged in");
                return;
            }

            console.log("User Id: ", user.id);

            // Get all of the organizations this user is a part of
            const { data: orgMemberships, error: orgError } = await supabase
                .from("org_members")
                .select("org_id, role, organizations (org_name)")
                .eq("user_id", user.id)
            if (orgError) {
                console.error("Error fetching organizations:", orgError);
                return;
            }

            // Build orgs list for org switcher
            const orgList: OrgOption[] = orgMemberships.map((m: any) => ({
                org_id: m.org_id,
                org_name: m.organizations?.org_name ?? m.org_id,
                role: m.role,
            }))
            setOrganizations(orgList);

            // Find the active org, default to first org in the list
            let activeOrg = orgList[0];

            if (orgIdFromParams) {
                const matchingOrg = orgList.find(org => org.org_id === orgIdFromParams);
                if (!matchingOrg) {
                    console.error('Organization not found or you do not have access to it.');
                    setLoading(false);
                    return;
                }
                activeOrg = matchingOrg;
                console.log("Active Organization name: ", activeOrg.org_name);
            }

            setOrgId(activeOrg.org_id);
            setRole(activeOrg.role);

        }
        fetchUserandOrgs();
    }, [orgIdFromParams])

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the latest audit log data
    useEffect(() => {
        if (!orgId || !role) return;
        const fetchLogs = async () => {
            let query = supabase
                .from("audit_logs")
                .select(`*, users (display_name)`)
                .eq("org_id", orgId)
                .order("created_at", { ascending: false })
                .limit(50);

            console.log("Role:", role);

            const auditVisibilityScope = getAuditVisibilityScope(role);

            console.log(auditVisibilityScope);


            if (auditVisibilityScope === 'financial_only') {
                console.log("Filtering for financial logs only");
                console.log("AuditLogType.FINANCIAL:", AuditLogType.FINANCIAL);
                query = query.eq("type", AuditLogType.FINANCIAL);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching audit logs:", error);
                return;
            }

            setLogs(data || []);
            setLoading(false);
        };
        fetchLogs();
    }, [orgId, supabase, role]);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Display the audit logs in a table format

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Audit Logs</h1>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">Loading...</p>
                </div>
            </main>
        );
    }

    if (!canViewAudit(role)) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Audit Logs</h1>
                        <BackButton />
                    </div>
                    {organizations.length > 1 && orgId && (
                        <div className="mb-6">
                            <OrgDropDown organizations={organizations} currentOrgId={orgId} basePath="/audit" />
                        </div>
                    )}
                    <p className="text-sm text-red-500 dark:text-red-400">You do not have permission to view audit logs.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Audit Logs</h1>
                    <BackButton />
                </div>

                {organizations.length > 1 && orgId && (
                    <div className="mb-6">
                        <OrgDropDown organizations={organizations} currentOrgId={orgId} basePath="/audit" />
                    </div>
                )}

                <div className={containerClass}>
                    <table className={tableClass}>
                        <thead>
                            <tr>
                                <th className={headerClass}>User</th>
                                <th className={headerClass}>Role</th>
                                <th className={headerClass}>Timestamp</th>
                                <th className={headerClass}>Action Type</th>
                                <th className={headerClass}>Item</th>
                                <th className={headerClass}>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.audit_id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                    <td className={cellClass}>{log.users?.display_name || "Unknown User"}</td>
                                    <td className={cellClass}>{formatDisplayRole(log.display_role)}</td>
                                    <td className={cellClass}>{new Date(log.created_at).toLocaleString()}</td>
                                    <td className={cellClass}>{formatAction(log.action)}</td>
                                    <td className={cellClass}>{formatEntity(log.entity, log.entity_id)}</td>
                                    <td className={cellClass}>{renderAuditDetails(log)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );

}


export default function AuditPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton width={64} height={28} />
                        <Skeleton width={112} height={38} rounded="sm" />
                    </div>
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex gap-2">
                            <Skeleton width={56} height={38} rounded="sm" />
                            <Skeleton width={72} height={38} rounded="sm" />
                            <Skeleton width={88} height={38} rounded="sm" />
                        </div>
                    </div>
                    <ul className="divide-y border rounded-lg">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <li key={i} className="flex items-center justify-between p-4">
                                <div className="flex flex-col gap-2">
                                    <Skeleton width={200} height={16} />
                                    <Skeleton width={140} height={13} />
                                </div>
                                <Skeleton width={36} height={14} />
                            </li>
                        ))}
                    </ul>
                </div>
            }
        >
            <AuditPageContent />
        </Suspense>
    )
}