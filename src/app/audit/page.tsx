"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { canViewAudit, getAuditVisibilityScope } from "@/lib/roles";
import { AuditLogType } from "./lib/data";
import { formatAction } from "./lib/util";
import {
  renderAuditDetails,
  cellStyle,
  headerStyle,
  containerStyle,
  tableStyle,
} from "./lib/render";
import BackButton from "@/components/BackButton";

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// AuditPage
// Responsibilities:
// - Fetch the current user and their organization
// - Query audit logs for transactions within the organization
// - Determine each user's role for display
// - Render the audit data in a structured table

export default function AuditPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [roleMap, setRoleMap] = useState<Map<string, string>>(new Map());
  const hasAuditAccess = canViewAudit(role);

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Fetch the user id
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.id) {
        console.log("Current userId from session:", session.user.id);
        setUserId(session.user.id);
      }
    };

    getUser();
  }, []);

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Fetch the orgId and role for this user from org_members
  useEffect(() => {
    const fetchOrg = async () => {
      if (!userId) return;

      const supabase = createClient();

      const { data, error } = await supabase
        .from("org_members")
        .select("org_id, role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching organizations:", error);
      }

      if (!data) {
        console.warn("User is not part of any organizations");
        return;
      }

      setOrgId(data.org_id);
      setRole(data.role);
    };

    fetchOrg();
  }, [userId]);

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Fetch the latest audit log data
  useEffect(() => {
    if (!orgId || !role) return;

    const fetchLogs = async () => {
      const supabase = createClient();

      let query = supabase
        .from("audit_logs")
        .select(`*, users (display_name)`)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

      console.log("Role:", role);

      const auditVisibilityScope = getAuditVisibilityScope(role);

      if (auditVisibilityScope === "financial_only") {
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
  }, [orgId, role]);

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Fetch the role for each user in the logs for display
  useEffect(() => {
    const fetchDisplayRoles = async () => {
      if (!orgId) return;

      const supabase = createClient();

      const { data, error } = await supabase
        .from("org_members")
        .select("user_id,role")
        .eq("org_id", orgId);

      if (error) {
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
  }, [orgId]);

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Display the audit logs in a table format

  if (!role) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "10px" }}>Recent Audit</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (!hasAuditAccess) {
    return (
      <div style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "10px" }}>Recent Audit</h2>
        <p>You do not have permission to view audit logs.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ marginBottom: "10px" }}>Recent Audit</h2>
        <BackButton></BackButton>
      </div>

      <div style={containerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
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
                  <td style={cellStyle}>
                    {log.users?.display_name || "Unknown User"}
                  </td>

                  <td style={cellStyle}>
                    {roleMap.get(log.user_id) || "Unknown Role"}
                  </td>

                  <td style={cellStyle}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  <td style={cellStyle}>{formatAction(log.action)}</td>

                  <td style={cellStyle}>
                    {log.entity}-{log.entity_id?.slice(0, 4) || ""}
                  </td>

                  <td style={cellStyle}>{renderAuditDetails(log)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}