"use client";

import { useState, useEffect } from "react";
import { logAuditEntry, LogEntry } from "./action";
import { createClient } from "@/lib/supabase/client";



export default function AuditPage(){
    const [userId, setUserId] = useState<string | null>(null);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [entity, setEntity] = useState("");
    const [entityId, setEntityId] = useState("");
    const [actionType, setActionType] = useState<"CREATE" | "UPDATE" | "DELETE">("CREATE");
    const [beforeData, setBeforeData] = useState("");
    const [afterData, setAfterData] = useState("");
    const [message, setMessage] = useState("");
    const [logs, setLogs] = useState<any[]>([]);

    const supabase = createClient();


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

    // Fetch the latest audit log data
    useEffect(() => {
        if (!orgId) return;

        const fetchLogs = async () => {
            const {data, error} = await supabase
            .from("audit_logs")
            .select("*, users (display_name)")
            .eq("org_id", orgId)
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
    
    // Inserts entries into the audit log
    // This is used only for testing, will be removed in completed implementation
    // Audit logs will only view changes from other tables
    const handleLogEntry = async () => {
        let beforeParsed, afterParsed;

        try {
            beforeParsed = beforeData ? JSON.parse(beforeData) : undefined;
            afterParsed = afterData ? JSON.parse(afterData) : undefined;
        } catch (error){
            setMessage("Invalid JSON in before/after data");
        }
        
        const entry: LogEntry = {
            orgId: orgId!, 
            userId: userId!, 
            action: actionType,
            entity,
            before_data: beforeParsed,
            after_data: afterParsed,
        };

        try{
            await logAuditEntry(entry);
            setMessage("Audit entry logged successfully.");

            const { data } = await supabase
            .from("audit_logs")
            .select("*, users (display_name)")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .limit(10);

            if (data) setLogs(data);
        
        }   catch(error: any){
            setMessage("Faild to log audit entry." + error.message);
        }
    };

    return(
        <div style = {{ padding: "20px" }}>
            <h1>Audit Log Test Page</h1>
            <div>
                <input placeholder="Entity" value={entity} onChange={e => setEntity(e.target.value)}/>
                <input placeholder="Entity ID" value={entityId} onChange={e => setEntityId(e.target.value)} />
                <select value={actionType} onChange={e => setActionType(e.target.value as "CREATE" | "UPDATE" | "DELETE")}>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                </select>
                <input placeholder="Before Data (JSON)" value={beforeData} onChange={e => setBeforeData(e.target.value)} />
                <input placeholder="After Data (JSON)" value={afterData} onChange={e => setAfterData(e.target.value)} />
                <button onClick={handleLogEntry}>Log Audit Entry</button>
            </div>
            <p>{message}</p>

            <h2>Recent Audit Entries</h2>
            <table>
                <thead>
                    <tr>
                        <th style={{ borderBottom: "1px solid black", textAlign: "left", padding: "8px" }}>Date</th>
                        <th style={{ borderBottom: "1px solid black", textAlign: "left", padding: "8px" }}>User</th>
                        <th style={{ borderBottom: "1px solid black", textAlign: "left", padding: "8px" }}>Action</th>
                        <th style={{ borderBottom: "1px solid black", textAlign: "left", padding: "8px" }}>Entity</th>
                        <th style={{ borderBottom: "1px solid black", textAlign: "left", padding: "8px" }}>Entity ID</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.audit_id}>
                            <td style={{ padding: "8px" }}>{new Date(log.created_at).toISOString().split("T")[0]}</td>
                            <td style={{ padding: "8px" }}>{log.users?.display_name || "Unknown User"}</td>
                            <td style={{ padding: "8px" }}>{log.action}</td>
                            <td style={{ padding: "8px" }}>{log.entity}</td>
                            <td style={{ padding: "8px" }}>{log.entity_id}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}