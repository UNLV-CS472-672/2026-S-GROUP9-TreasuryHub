import { getDiff } from "./util";

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
            return <span className="font-medium text-green-600 dark:text-green-400">{action}</span>;
        case "UPDATE":
            return <span className="font-medium text-yellow-600 dark:text-yellow-400">{action}</span>;
        case "DELETE":
            return <span className="font-medium text-red-600 dark:text-red-400">{action}</span>;
        default:
            return <span className="text-gray-500 dark:text-neutral-400">UNKNOWN</span>;
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

export const cellClass =
    "py-4 px-3 text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/[0.08] align-top";

export const headerClass =
    "py-3 px-3 text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400 text-left border-b border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.02]";

export const containerClass =
    "rounded-2xl border border-gray-200 dark:border-white/[0.12] overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-white dark:bg-white/[0.03]";

export const tableClass = "w-full text-sm border-collapse";