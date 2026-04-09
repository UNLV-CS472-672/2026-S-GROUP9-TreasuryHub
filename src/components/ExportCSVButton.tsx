"use client";

import { exportCSV } from "@/app/export-csv/action";
import { useState } from "react";

type Toast = {
  type: "error" | "warning" | "success";
  message: string;
} | null;

export default function ExportCSVButton({ orgId, className }: { orgId: string; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 4000); // auto-dismiss
  };

  const handleExport = async () => {
    setLoading(true);

    const result = await exportCSV(orgId);

    if ("error" in result) {
      if (result.code === "no_permission") {
        showToast({
          type: "warning",
          message: result.error ?? "You do not have permission to export.",
        });
      } else {
        showToast({
          type: "error",
          message: result.error ?? "Export failed.",
        });
      }
      setLoading(false);
      return;
    }

    const { data, orgName } = result;
    const safeName = orgName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const escapeCell = (value: unknown): string => {
      if (value == null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = Object.keys(data[0]).map(escapeCell).join(",");
    const rows = data.map((row) =>
      Object.values(row).map(escapeCell).join(",")
    ).join("\n");

    const csv = `${headers}\n${rows}`;

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}_transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast({ type: "success", message: "Export completed 🎉" });

    setLoading(false);
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <div
            className={`px-4 py-3 rounded shadow-lg text-sm border ${
              toast.type === "error"
                ? "bg-red-50 border-red-300 text-red-700"
                : toast.type === "warning"
                ? "bg-orange-50 border-orange-300 text-orange-700"
                : "bg-green-50 border-green-300 text-green-700"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleExport}
        disabled={!orgId || loading}
        className={
          className ??
          "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
        }
      >
        {loading ? "Exporting..." : "Export Transactions"}
      </button>
    </>
  );
}