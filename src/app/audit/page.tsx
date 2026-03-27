"use client";

import { useState, useEffect } from "react";
import { logAuditEntry, LogEntry } from "./action";

// This is a temporary hardcoded org ID from files/page.tsx for testing purposes.
// You can use a different org ID, just make sure it exists in the organizations table.
const TEST_ORG_ID = '10148741-4cbb-4d58-977d-13fdd4398eb4'

// This is a temporary hardcoded user ID for testing purposes.
// This user ID belongs to 
// Display Name: JimmyRings
// you can change it to your user ID if you like.
const TEST_USER_ID = "9e3c6b5a-e9ce-4285-b6c4-5db7fc1d737d" 

export default function AuditPage(){
    const [message, setMessage] = useState("");
    
    const handleLogEntry = async () => {
        const dummyEntry: LogEntry = {
            orgId: TEST_ORG_ID, 
            userId: TEST_USER_ID, // Replace with actual user ID from auth context when available
            action: "CREATE",
            entity: "TestEntity",
            entityId: "33333333-3333-3333-3333-333333333333",
            before_data: null,
            after_data: null,
        };

        try{
            await logAuditEntry(dummyEntry);
            setMessage("Audit entry logged successfully. Check console for details.");
        }
        catch(error){
            setMessage("Faild to log audit entry.");
        }
    };

    return(
        <div style = {{ padding: "20px" }}>
            <h1>Audit Log Test</h1>
            <button onClick={handleLogEntry}>Log Audit Entry</button>
            <p>{message}</p>
        </div>
    );
}