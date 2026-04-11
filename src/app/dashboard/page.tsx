import Link from "next/link";
import { getDashboardData } from "@/lib/supabase/dashboard";
import ExportCSVButton from "@/components/ExportCSVButton";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    orgId?: string;
  }>;
};

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

function LinkCard({
  href,
  label,
  title,
  description,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
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
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
        {title}
      </p>
      <p className="mt-2 text-sm text-neutral-300 transition group-hover:text-white">
        {description}
      </p>
    </Link>
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
  orgId,
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
  orgId: string;
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/transaction?orgId=${orgId}`}
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
            View Transactions
          </Link>

          <ExportCSVButton orgId={orgId} 
            className="
              rounded-xl
              border border-white/[0.2]
              bg-blue-500/[0.05]
              px-4 py-2
              text-sm font-medium text-white
              transition
              hover:border-white/[0.35]
              hover:bg-blue-100/[0.08]
            "
          />
        </div>
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

function TasksSection({ orgId }: { orgId: string }) {
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            View and manage organization tasks.
          </p>
        </div>

        <Link
          href={`/tasks?orgId=${orgId}`}
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
          Open Tasks
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-white/[0.12] px-4 py-6 text-sm text-neutral-400">
        Go to the tasks page to see assignments, deadlines, and updates.
      </div>
    </section>
  );
}

function NoOrganizationState() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <section
          className="
            w-full rounded-3xl border border-white/[0.12] bg-white/[0.03]
            p-10 text-center backdrop-blur-sm
            shadow-[0_0_20px_rgba(255,255,255,0.05)]
          "
        >
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
            TreasuryHub
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            You are not in an organization yet
          </h1>

          <p className="mt-4 text-sm text-neutral-300 sm:text-base">
            Join or create an organization from the home page to start using the dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="
                inline-flex items-center rounded-xl
                border border-white/[0.2] bg-white/[0.05]
                px-5 py-3 text-sm font-medium text-white transition
                hover:border-white/[0.35] hover:bg-white/[0.08]
              "
            >
              Go to Home Page
            </Link>

            <Link
              href="/organizations"
              className="
                inline-flex items-center rounded-xl
                border border-blue-400/30 bg-blue-500/10
                px-5 py-3 text-sm font-medium text-white transition
                hover:border-blue-300/50 hover:bg-blue-500/20
              "
            >
              Join an Organization
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { orgId } = await searchParams;

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;

  try {
    data = await getDashboardData(orgId);
  } catch {
    return <NoOrganizationState />;
  }

  if (!data || !data.orgId || !data.organizations?.length) {
    return <NoOrganizationState />;
  }

  const canAccessFiles =
    data.role === "executive" ||
    data.role === "advisor" ||
    data.role === "treasurer" ||
    data.role === "treasury_team" ||
    data.role === "admin";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <Navbar
        organizations={data.organizations}
        currentOrgId={data.orgId}
        currentOrgName={
          data.organizations.find(org => org.org_id === data.orgId)?.org_name || "Unknown Org"
        }
        basePath="/dashboard"
        logoSrc="/assets/tmp.logo.png"
        pageTitle="Dashboard"
      />

        {data.scope === "organization" ? (
          <div className="space-y-8">
            <section
              className={`grid gap-4 md:grid-cols-2 ${canAccessFiles ? "xl:grid-cols-7" : "xl:grid-cols-6"
                }`}
            >
              <StatCard
                label="Income"
                value={formatCurrency(data.summary.income)}
              />
              <StatCard
                label="Expenses"
                value={formatCurrency(data.summary.expenses)}
              />
              <StatCard label="Net" value={formatCurrency(data.summary.net)} />
              <StatCard
                label="Transactions"
                value={data.summary.transactionCount}
              />

              <LinkCard
                href={`/audit?orgId=${data.orgId}`}
                label="Audit"
                title={String(data.summary.auditCount)}
                description="Review recent audit activity →"
              />

              <QuotesCard />

              {canAccessFiles && (
                <LinkCard
                  href={`/files?orgId=${data.orgId}`}
                  label="Files"
                  title="Open"
                  description="View and manage organization files →"
                />
              )}
            </section>

            <TransactionsTable
              title="Recent Organization Transactions"
              transactions={data.recentTransactions}
              orgId={data.orgId}
            />

            <TasksSection orgId={data.orgId} />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Reimbursements"
                value={formatCurrency(data.summary.reimbursementsTotal)}
              />
              <StatCard
                label="Payables"
                value={formatCurrency(data.summary.payablesTotal)}
              />
              <StatCard
                label="Receivables"
                value={formatCurrency(data.summary.receivablesTotal)}
              />
              <StatCard
                label="Transactions"
                value={data.summary.personalTransactionCount}
              />
              <StatCard
                label="Uploaded Files"
                value={data.summary.uploadedFilesCount}
              />
            </section>

            <TransactionsTable
              title="My Recent Transactions"
              transactions={data.recentTransactions}
              orgId={data.orgId}
            />

            <TasksSection orgId={data.orgId} />
          </div>
        )}
      </div>
    </main>
  );
}