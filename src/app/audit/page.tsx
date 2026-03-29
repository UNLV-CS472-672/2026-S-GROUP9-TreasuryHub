"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuditLogType } from "./auditType";

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// getDiff
// Compares before and after objects and
// returns only the fields that have changed
//
// Responsibilities:
// - field: property name
// - oldValue: value from the before object (or "-" if undefined)
// - newValue: value from the after object (or "-" if undefined) 

function getDiff(before: any, after: any) {
    const beforeObj = before ?? {};
    const afterObj = after ?? {};

  const fields = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  const changes = [];

  for (const field of fields) {
    const beforeValue = beforeObj[field];
    const afterValue = afterObj[field];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push({
        field,
        oldValue: beforeObj[field] ?? "-",
        newValue: afterObj[field] ?? "-",
      });
    }
  }

  return changes;
}

// formatAction
// Converts action types to more user-friendly text
const formatAction = (action: string) => {
    switch (action) {
        case "CREATE":
            return "Created";
        case "UPDATE":
            return "Updated";
        case "DELETE":
            return "Deleted";
        default:
            return action;
    }
};

// renderDetails
// Renders the details of an audit log entry based on the action type
// - For CREATE actions, it shows the after_data fields
// - For DELETE actions, it shows the before_data fields
// - For UPDATE actions, it shows a side-by-side comparison of changed fields using getDiff
function renderDetails(log: any) {

    if (log.action === "CREATE") {
        const after = log.after_data ?? {};

        return Object.entries(after).map(([field, value]) => (
            <div key={field}>
                <strong>{field}:</strong>: {String(value)}
            </div>
        ));
    }

    if (log.action === "DELETE") {
        const before = log.before_data ?? {};

        return Object.entries(before).map(([field, value]) => (
            <div key={field}>
                <strong>{field}:</strong> {String(value)}
            </div>
        ));
    }

    const changes = getDiff(log.before_data, log.after_data);

    if (changes.length === 0) {
        return <div>No changes</div>;
    }

    return changes.map((change: any, index: number) => (
            <div key={index}>
                <strong>{change.field}:</strong> {change.oldValue} → {change.newValue}
            </div>  
        ));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AuditPage
// Responsibilities:
// - Fetch the current user and their organization
// - Query audit logs for transactions within the organization
// - Determine each user's role for display
// - Render the audit data in a structured table

export default function AuditPage(){
    const [userId, setUserId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [roleMap, setRoleMap] = useState<Map<string, string>>(new Map());
    const canViewAudit = role === "treasurer" || role === "admin";

    const supabase = createClient();

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the user id
    useEffect(() => {
        const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
        console.log("Current userId from session:", session.user.id);
        setUserId(session.user.id);
        }
    };
        getUser();
    }, [supabase]);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the orgId and role for this user from org_members
    useEffect(() => {
        const fetchOrg = async () => {
            if(!userId) return;

            const { data, error} = await supabase
            .from("org_members")
            .select("org_id, role")
            .eq("user_id", userId)
            .single();

            if (error){
                console.error("Error fetching organizations:", error);
            }
            
            if (!data){
                console.warn("User is not part of any organizations");
                return;
            }

            setOrgId(data.org_id);
            setRole(data.role);

        };
        fetchOrg();
    }, [userId, supabase])

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the latest audit log data
    useEffect(() => {
        if (!orgId) return;
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
    // Fetch the Display Roles for users of the organization
    useEffect(() => {
        const fetchDisplayRoles = async () => {
            if(!orgId) return;

            const{ data, error} = await supabase
            .from("org_members")
            .select("user_id,role")
            .eq("org_id", orgId)


            if (error){
                console.error("Error fetching display roles:", error);
                return;
            } 
            if (!data) return;

            const map = new Map<string, string>();

            data.forEach((member) => {
                map.set(member.user_id, member.role);
            });

            setRoleMap(map);
        };
        fetchDisplayRoles();
    }, [orgId])
    

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Table Styles
    // - cellStyle: base style for all table cells
    // - boldCellStyle: same as cellStyle with bold font
    // - specialCellStyle: style for cell without top border (used for row-spanned cells)
    // - headerStyle: style applied to table headers
    // - containerStyle: outer wrapper around the table
    // - tableStyle: style applied to the table itself

    const cellStyle: React.CSSProperties = {
        border: "1px solid #374151",
        padding: "10px",
        borderTop: "2px solid #d1d5db",
    };

    const headerStyle = {
        border: "1px solid #e5e7eb",
        backgroundColor: "#111827",
        textAlign: "left" as const,
        padding: "12px",
        fontWeight: "600",
    };
    
    const containerStyle = {
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    };

    const tabelStyle = {
        width: "100%",
        borderCollapse: "collapse" as const,
        fontSize: "14px",
    };


    if (!role) {
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
                <p>You do not have permission to view audit logs.</p>
            </div>
        );
    }


    return(
        <div style={{padding: "20px"}}>

            {/* Page Title */}
            <h2 style={{marginBottom: "10px"}}>Recent Audit</h2>

            {/* Container around the table*/}
            <div style={containerStyle}>
                <table style={tabelStyle}>

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
                                    {roleMap.get(log.user_id) || "Unknown Role"}
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
                                    {renderDetails(log)}
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