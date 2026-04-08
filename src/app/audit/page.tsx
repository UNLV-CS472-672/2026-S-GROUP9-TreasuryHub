"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditLogType } from "./lib/data";
import { formatAction } from "./lib/util";
import { renderAuditDetails, cellStyle, headerStyle, containerStyle, tableStyle} from "./lib/render";
import BackButton from "@/components/BackButton";
import OrgSwitcher from "@/components/OrgSwitcher";
import { useSearchParams } from "next/navigation";


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

export default function AuditPage(){
    const seachParams = useSearchParams();
    const orgIdFromParams = seachParams.get("orgId");


    const [userId, setUserId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(orgIdFromParams);
    const [organizations, setOrganizations] = useState<OrgOption[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [orgError, setOrgError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const canViewAudit = role === "treasurer" || role === "admin";

    const supabase = createClient();

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the current user's ID, organizations and role
      useEffect(() => {
        const fetchUserandOrgs = async () => {
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

            if (role == 'treasurer') {
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
    

    if (!canViewAudit){
        return (
            <div style={{padding: "20px"}}>
                <h2 style={{marginBottom: "10px"}}>Recent Audit</h2>
                 {organizations.length > 1 && orgId && (
                            <div className="mb-6">
                                <OrgSwitcher
                                    organizations={organizations}
                                    currentOrgId={orgId}
                                    basePath="/audit"
                                />
                            </div>
                        )}
                <p>You do not have permission to view audit logs.</p>
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
                                <OrgSwitcher
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
                                    {log.display_role || "Unknown Role"}
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