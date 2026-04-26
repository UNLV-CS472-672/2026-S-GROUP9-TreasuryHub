import { stat } from "fs";
import { getDiff } from "./util";
import { spawn } from "child_process";
import { ROLE_LABELS } from "@/lib/roles";
import { Span } from "next/dist/trace";

// renderDetails
// Renders the details of an audit log entry based on the action type
// - For CREATE actions, it shows the after_data fields
// - For DELETE actions, it shows the before_data fields
// - For UPDATE actions, it shows a side-by-side comparison of changed fields using getDiff
export function renderAuditDetails(log: any) {

    switch(log.action) {

        case "CREATE":
            const after = log.after_data ?? {}

            return Object.entries(after).map(([field, value]) => (
            <div key={field}>
                <strong>{field}:</strong>: {String(value)}
            </div>
        ));
    


        case "DELETE":
            const before = log.before_data ?? {};

            return Object.entries(before).map(([field, value]) => (
                <div key={field}>
                    <strong>{field}:</strong> {String(value)}
                </div>
            ));

        case "UPDATE":
            const changes = getDiff(log.before_data, log.after_data);

            

            if (changes.length === 0) {
                return <div>No changes</div>;
            }

            return changes.map((change: any, index: number) => (
                    <div key={index}>
                        <strong>{change.field}:</strong> {change.oldValue} → {change.newValue}
                    </div>  
                ));

        default: 
            console.error("Invalide Action Case.");
            return null;
    }
}

export function formatDisplayRole(role?: string | null) {
    return role? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown Role";
}

export function formatEntity(entity: string, entityID: string){
    return `${entity.charAt(0).toUpperCase()+entity.slice(1)}-${entityID?.slice(0, 4) || ""}`;
}

// formatAction
// Converts action types to more user-friendly text
export const formatAction = (action: string) => {
    switch (action) {
        case "CREATE":
            return <span style={{color: "#4ade80"}}>{action}</span>;
        case "UPDATE":
            return <span style={{color: "#facc15"}}>{action}</span>;
        case "DELETE":
            return <span style={{color: "#f87171"}}>{action}</span>;
        default:
            return <span>UNKNOWN</span>;
    }
};



//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Table Styles
// - cellStyle: base style for all table cells
// - boldCellStyle: same as cellStyle with bold font
// - specialCellStyle: style for cell without top border (used for row-spanned cells)
// - headerStyle: style applied to table headers
// - containerStyle: outer wrapper around the table
// - tableStyle: style applied to the table itself

export const cellStyle: React.CSSProperties = {
    border: "1px solid #374151",
    padding: "10px",
    borderTop: "2px solid #d1d5db",
};

export const headerStyle = {
    border: "1px solid #e5e7eb",
    backgroundColor: "#111827",
    textAlign: "left" as const,
    padding: "12px",
    fontWeight: "600",
};
    
export const containerStyle = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
};

export const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
};