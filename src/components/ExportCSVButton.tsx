// components/ExportCSVButton.tsx
"use client";

import { exportCSV } from "@/app/export-csv/action";
import { useState } from "react";
//import { exportCSV } from "@/app/export-csv/action"; // adjust path as needed

type ExportCSVButtonProps = {
  orgId: string;
  className?: string;
};

export default function ExportCSVButton({ orgId, className }: ExportCSVButtonProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setPermissionError(null);
    setExportError(null);
    setLoading(true);

    const result = await exportCSV(orgId);

    if ("error" in result) {
      if (result.code === "no_permission") {
        setPermissionError(result.error ?? "You do not have permission to export.");
      } else {
        setExportError(result.error ?? "An error occurred during export.");
      }
      setLoading(false);
      return;
    }

    const { data, orgName } = result;
    const safeName = orgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = Object.keys(data[0]).map(escapeCell).join(",");
    const rows = data.map((row) => Object.values(row).map(escapeCell).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(false);
  };

  return (
    <div className="space-y-2">
      {permissionError && (
        <div className="bg-orange-50 border border-orange-300 text-orange-700 px-4 py-3 rounded">
          <p className="font-medium">Permission Denied</p>
          <p className="text-sm">{permissionError}</p>
        </div>
      )}
      {exportError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Export Failed</p>
          <p className="text-sm">{exportError}</p>
        </div>
      )}
      <button
        onClick={handleExport}
        disabled={!orgId || loading}
        className={className ?? "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"}
      >
        {loading ? "Exporting..." : "Export Transactions"}
      </button>
    </div>
  );
}