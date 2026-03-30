import { getDiff } from "./util";

// renderDetails
// Renders the details of an audit log entry based on the action type
// - For CREATE actions, it shows the after_data fields
// - For DELETE actions, it shows the before_data fields
// - For UPDATE actions, it shows a side-by-side comparison of changed fields using getDiff
export function renderAuditDetails(log: any) {

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