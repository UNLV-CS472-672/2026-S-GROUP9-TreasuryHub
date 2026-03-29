import Link from "next/link";
import { getDashboardData } from "@/lib/supabase/dashboard";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border border-white/[0.12]
        bg-white/[0.03]
        p-5
        backdrop-blur-sm
        transition duration-300
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
        hover:border-white/[0.25]
        hover:bg-white/[0.06]
        hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
      "
    >
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function QuotesCard() {
  return (
    <Link
      href="/quotes"
      className="
        group
        rounded-2xl
        border border-white/[0.12]
        bg-white/[0.03]
        p-5
        backdrop-blur-sm
        transition duration-300
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
        hover:border-white/[0.25]
        hover:bg-white/[0.06]
        hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
      "
    >
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
        Quotes
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Open
      </p>
      <p className="mt-2 text-sm text-neutral-300 transition group-hover:text-white">
        Review and manage vendor quotes →
      </p>
    </Link>
  );
}

function TransactionsTable({
  title,
  transactions,
}: {
  title: string;
  transactions: {
    transaction_id: string;
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
  }[];
}) {
  return (
    <section
      className="
        rounded-2xl
        border border-white/[0.12]
        bg-white/[0.03]
        p-6
        backdrop-blur-sm
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
      "
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
          Latest Activity
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-neutral-200">
          <thead>
            <tr className="border-b border-white/[0.2] text-left text-xs uppercase tracking-[0.16em] text-neutral-400">
              <th className="py-3 pr-6 font-medium">Date</th>
              <th className="py-3 pr-6 font-medium">Description</th>
              <th className="py-3 pr-6 font-medium">Category</th>
              <th className="py-3 pr-6 font-medium">Type</th>
              <th className="py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.transaction_id}
                className="
                  border-b border-white/[0.12]
                  transition
                  hover:bg-white/[0.05]
                "
              >
                <td className="py-4 pr-6 text-neutral-400">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="py-4 pr-6 text-white">{tx.description}</td>
                <td className="py-4 pr-6 text-neutral-400">{tx.category}</td>
                <td className="py-4 pr-6 capitalize text-neutral-300">
                  {tx.type}
                </td>
                <td className="py-4 text-right font-semibold text-white">
                  {formatCurrency(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.2] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-neutral-400">
              TreasuryHub
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Dashboard
              </h1>

              <span className="rounded-full border border-white/[0.2] bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.16em] text-neutral-200">
                {data.orgName}
              </span>
            </div>
          </div>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="
                rounded-xl
                border border-white/[0.2]
                bg-white/[0.05]
                px-4 py-2
                text-sm font-medium text-white
                transition
                hover:border-white/[0.35]
                hover:bg-white/[0.08]
              "
            >
              Sign Out
            </button>
          </form>
        </header>

        {data.scope === "organization" ? (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard label="Income" value={formatCurrency(data.summary.income)} />
              <StatCard label="Expenses" value={formatCurrency(data.summary.expenses)} />
              <StatCard label="Net" value={formatCurrency(data.summary.net)} />
              <StatCard label="Transactions" value={data.summary.transactionCount} />
              <StatCard
                label="Files / Audit"
                value={`${data.summary.fileCount} / ${data.summary.auditCount}`}
              />
              <QuotesCard />
            </section>

            <TransactionsTable
              title="Recent Organization Transactions"
              transactions={data.recentTransactions}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard label="Reimbursements" value={formatCurrency(data.summary.reimbursementsTotal)} />
              <StatCard label="Payables" value={formatCurrency(data.summary.payablesTotal)} />
              <StatCard label="Receivables" value={formatCurrency(data.summary.receivablesTotal)} />
              <StatCard label="Transactions" value={data.summary.personalTransactionCount} />
              <StatCard label="Uploaded Files" value={data.summary.uploadedFilesCount} />
            </section>

            <TransactionsTable
              title="My Recent Transactions"
              transactions={data.recentTransactions}
            />
          </div>
        )}
      </div>
    </main>
  );
}