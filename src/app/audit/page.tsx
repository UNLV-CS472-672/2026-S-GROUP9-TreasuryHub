"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { canViewAudit, getAuditVisibilityScope } from "@/lib/roles";
import { AuditLogType } from "./lib/data";
import { formatAction } from "./lib/util";
import {
  renderAuditDetails,
  formatDisplayRole,
  cellStyle,
  headerStyle,
  containerStyle,
  tableStyle,
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

function AuditPageContent(){
    const searchParams = useSearchParams();
    const orgIdFromParams = searchParams.get("orgId");


    const [userId, setUserId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(orgIdFromParams);
    const [organizations, setOrganizations] = useState<OrgOption[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [orgError, setOrgError] = useState<string | null>(null);
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
            const { data: orgMemberships, error: orgError} = await supabase
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
                    setOrgError('Organization not found or you do not have access to it.');
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
        };
        fetchLogs();
    }, [orgId, supabase, role]);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Display the audit logs in a table format

    // loading 
    if (!orgId) {
        return (
            <div style={{padding: "20px"}}>
                <h2 style={{marginBottom: "10px"}}>Recent Audit</h2>
                <p>Loading...</p>
            </div>
        );
    }
    

    if (!canViewAudit(role)){
        return (
            <div style={{padding: "20px"}}>
                <h2 style={{marginBottom: "10px"}}>Recent Audit</h2>
                 {organizations.length > 1 && orgId && (
                            <div className="mb-6" style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                                <OrgDropDown
                                    organizations={organizations}
                                    currentOrgId={orgId}
                                    basePath="/audit"
                                />
                                <BackButton></BackButton>
                            </div>
                        )}
                <p>You do not have permission to view audit logs.</p>
                <BackButton></BackButton>
            </div>
        );
    }


    return(
        <div style={{padding: "20px"}}>

            {/* Page Title */}
            <div className="flex items-center justify-between mb-3">
                <h2 style={{marginBottom: "10px"}}>Recent Audit</h2>
                <BackButton></BackButton>
            </div>
            {organizations.length > 1 && orgId && (
                            <div className="mb-6">
                                <OrgDropDown
                                    organizations={organizations}
                                    currentOrgId={orgId}
                                    basePath="/audit"
                                />
                            </div>
                        )}


            {/* Container around the table*/}
            <div style={containerStyle}>
                <table style={tableStyle}>

                    {/* Table header row */}
                    <thead>
                        <tr>
                            {/* Column headers */}
                            <th style={headerStyle}>User</th>
                            <th style={headerStyle}>Role</th>
                            <th style={headerStyle}>Timestamp</th>
                            <th style={headerStyle}>Action Type</th>
                            <th style={headerStyle}>Item</th>
                            <th style={headerStyle}>Description</th>
                        </tr>
                    </thead>

                    <tbody>
                    {logs.map((log) => {
                        return (
                            <tr key={log.audit_id}>

                                {/* User Column */}
                                <td style={cellStyle}>
                                    {log.users?.display_name || "Unknown User"}
                                </td>

                                {/* Role Column */}
                                <td style={cellStyle}>
                                    {formatDisplayRole(log.display_role)}
                                </td>

                                {/* Timestamp Column */}
                                <td style={cellStyle}>
                                    {new Date(log.created_at).toLocaleString()}
                                </td>

                                {/* Action Type Column */}
                                <td style={cellStyle}>
                                    {formatAction(log.action)}
                                </td>

                                {/* Item Column */}
                                <td style={cellStyle}>
                                    {log.entity}-{log.entity_id?.slice(0, 4) || ""}
                                </td>

                                {/* Description Column */}
                                <td style={cellStyle}>
                                    {renderAuditDetails(log)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                </table>
            </div>
        </div>
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