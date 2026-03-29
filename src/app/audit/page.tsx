"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
    if (beforeObj[field] !== afterObj[field]) {
      changes.push({
        field,
        oldValue: beforeObj[field] ?? "-",
        newValue: afterObj[field] ?? "-",
      });
    }
  }

  return changes;
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
    }, []);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the orgId for this user from org_members
    useEffect(() => {
        const fetchOrg = async () => {
            if(!userId) return;

            const { data, error} = await supabase
            .from("org_members")
            .select("org_id")
            .eq("user_id", userId)
            .single();

            if (error) console.error("Error fetching orgId", error);
            else {
                console.log("Fetched orgId:", data?.org_id);
                if (data?.org_id) setOrgId(data.org_id);
            else console.warn("No org_id found for this user in org_members table");
            }
        };
        fetchOrg();
    }, [userId, supabase])

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the latest audit log data
    useEffect(() => {
        if (!orgId) return;
        const fetchLogs = async () => {
            const {data, error} = await supabase
            .from("audit_logs")
            .select("*, users (display_name)")
            .eq("org_id", orgId)
            .eq("entity", "transaction")
            .order("created_at", {ascending: false})
            .limit(10);

            if (data) {
                setLogs(data);
            }
            else if (error){ 
                console.error("Error fetching audit logs:", error);
            }
        };
        fetchLogs();
    }, [orgId, supabase]);

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Fetch the roles
    useEffect(() => {
        const fetchRoles = async () => {
            if(!orgId || !userId) return;

            const{ data, error} = await supabase
            .from("org_members")
            .select("role")
            .eq("org_id", orgId)
            .eq("user_id", userId)
            .single();

            if(data){
                setRole(data.role);
            } else if (error) {
                console.error("Error fetching role:", error);
            }
        };
        fetchRoles();
    }, [orgId, userId, supabase])
    

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

    const boldCellStyle: React.CSSProperties = {
        border: "1px solid #374151",
        padding: "10px",
        borderTop: "2px solid #d1d5db",
        fontWeight: "500",
    };

    const specialCellStyle: React.CSSProperties = {
        border: "1px solid #374151",
        padding: "10px",
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
                            <th style={headerStyle}>Data</th>
                            <th style={headerStyle}>User</th>
                            <th style={headerStyle}>Role</th>
                            <th style={headerStyle}>Action</th>
                            <th style={headerStyle}>Item</th>
                            <th style={headerStyle}>Field</th>
                            <th style={headerStyle}>Old Value</th>
                            <th style={headerStyle}>New Value</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* Loop through each audit log entry */}
                        {logs.map((log, logIndex) => {
                            const diffs = getDiff(log.before_data, log.after_data);
                            return diffs.map((diff, index) => (
                                <tr
                                key={`${log.audit_id}-${index}`}

                                // Alternate row colors
                                 style={{backgroundColor: logIndex % 2 === 0 ? "#111827" : "#1f2637",}}>

                                    {/* Renders cell once per log and merges multiple diff rows using rowSpan */}
                                    {index === 0 && (
                                        <>
                                            {/* Date */}
                                            <td rowSpan={diffs.length} style={boldCellStyle}>
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </td>
                                            
                                            {/* User */}
                                            <td rowSpan={diffs.length} style={cellStyle}>
                                                {log.users?.display_name || "Unknown User"}
                                            </td>

                                            {/* Role */}
                                            <td rowSpan={diffs.length} style={cellStyle}>
                                                {role}
                                            </td>

                                            {/* Action */}
                                            <td rowSpan={diffs.length} style={cellStyle}>
                                                {log.action}
                                            </td>

                                            {/* Item */}
                                            <td rowSpan={diffs.length} style={cellStyle}>
                                                {log.entity}-{log.entity_id.slice(0, 8)}
                                            </td>
                                        </>
                                    )}

                                    {/* These cells change per diff, they could contain more than one value to display */}
                                    {/* Field */}
                                    <td style={specialCellStyle}>{diff.field}</td>

                                    {/* Old Value */}
                                    <td style={specialCellStyle}>{diff.oldValue === "-" ? "—" : String(diff.oldValue)}</td>

                                    {/* New Value */}
                                    <td style={specialCellStyle}>{diff.newValue === "-" ? "—" : String(diff.newValue)}</td>
                                 </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

}