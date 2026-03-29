/**
 * DASHBOARD PAGE (Server Component)
 *
 * - Fetches dashboard data from Supabase
 * - Displays different UI based on role
 * - Includes sign out + quotes navigation
 */

import Link from "next/link";
import { getDashboardData } from "@/lib/supabase/dashboard";

// Force dynamic rendering (needed for auth/cookies)
export const dynamic = "force-dynamic";

/**
 * Format numbers as USD currency
 */
function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/**
 * Reusable stat card
 */
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/**
 * MAIN PAGE
 */
export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}
        <div className="flex items-center justify-between">
          
          {/* LEFT: Title + Org */}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {data.orgName}
            </span>
          </div>

          {/* RIGHT: Sign Out */}
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* ============================= */}
        {/* ORGANIZATION DASHBOARD */}
        {/* ============================= */}
        {data.scope === "organization" ? (
          <>
            {/* ============================= */}
            {/* TOP STAT CARDS */}
            {/* ============================= */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Income" value={formatCurrency(data.summary.income)} />
              <StatCard label="Expenses" value={formatCurrency(data.summary.expenses)} />
              <StatCard label="Net" value={formatCurrency(data.summary.net)} />
              <StatCard label="Transactions" value={data.summary.transactionCount} />
              <StatCard
                label="Files / Audit Logs"
                value={`${data.summary.fileCount} / ${data.summary.auditCount}`}
              />

              {/* ============================= */}
              {/* QUOTES NAVIGATION CARD */}
              {/* ============================= */}
              <Link
                href="/quotes"
                className="rounded-2xl border bg-gradient-to-r from-blue-500 to-purple-500 p-5 text-white shadow hover:opacity-95 transition"
              >
                <p className="text-sm opacity-80">Quotes</p>
                <p className="mt-2 text-xl font-semibold">
                  View & Manage Quotes →
                </p>
                <p className="mt-1 text-xs opacity-80">
                  Review and approve vendor quotes
                </p>
              </Link>
            </div>

            {/* ============================= */}
            {/* TRANSACTIONS TABLE */}
            {/* ============================= */}
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Recent Organization Transactions
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-700">
                  <thead className="text-left text-slate-500">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx.transaction_id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">{tx.description}</td>
                        <td className="py-3 pr-4">{tx.category}</td>
                        <td className="py-3 pr-4 capitalize">{tx.type}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* ============================= */}
            {/* PERSONAL DASHBOARD */}
            {/* ============================= */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="My Reimbursements"
                value={formatCurrency(data.summary.reimbursementsTotal)}
              />
              <StatCard
                label="My Payables"
                value={formatCurrency(data.summary.payablesTotal)}
              />
              <StatCard
                label="My Receivables"
                value={formatCurrency(data.summary.receivablesTotal)}
              />
              <StatCard
                label="My Transactions"
                value={data.summary.personalTransactionCount}
              />
              <StatCard
                label="My Uploaded Files"
                value={data.summary.uploadedFilesCount}
              />
            </div>

            {/* Personal transactions table */}
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                My Recent Transactions
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-700">
                  <thead className="text-left text-slate-500">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx.transaction_id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">{tx.description}</td>
                        <td className="py-3 pr-4">{tx.category}</td>
                        <td className="py-3 pr-4 capitalize">{tx.type}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}