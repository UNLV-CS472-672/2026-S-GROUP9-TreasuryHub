"use client";

import { exportCSV } from "./action";

export default function CSVPage( ) {
    const organizationId = "10148741-4cbb-4d58-977d-13fdd4398eb4"; // orgID for testorg1 but will need to be dynamic in the future
    const handleExport = async (organizationId: string) => {
    const result = await exportCSV(organizationId);
    if ('error' in result) return;
    const data = result.data;
    if (!data) return;

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
};

    return (
        <div>
            <h1>Exporting Transactions into CSV File</h1>
            <button onClick={() => handleExport(organizationId)}
                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition-all">
                Export Transactions
            </button>
        </div>
    );
}