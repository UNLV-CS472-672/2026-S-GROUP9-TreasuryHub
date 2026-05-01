import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/supabase/dashboard";
import ExportCSVButton from "@/components/ExportCSVButton";
import { canExportTransactions, canViewFiles } from "@/lib/roles";
import Navbar from "@/components/Navbar";
import { getTasks } from "@/app/tasks/actions";
import TaskRoleFilter from "@/components/TaskRoleFilter";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  ReceiptText,
  ShieldCheck,
  FileText,
  ClipboardList,
  Upload,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "Dashboard | TreasuryHub",
  },
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{
    orgId?: string;
    taskRole?: string;
  }>;
};

type DashboardTask = {
  id: number;
  title: string;
  task_type: string;
  assign_type: "role" | "individual";
  assigned_to: string;
  due_date: string | null;
};

function formatDateOnly(dateString: string | null) {
  if (!dateString) return "No due date";

  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
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
  icon,
  accent,
  hoverAccent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  hoverAccent?: string;
}) {
  return (
    <div //chnaged for layout -prabh
      className= {`
        lb-card
        rounded-2xl
        border border-gray-200 dark:border-white/[0.12] 
        bg-white dark:bg-white/[0.03]
        p-5
        backdrop-blur-sm
        transition duration-300
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
        hover:border-gray-300
        hover:bg-gray-50
        hover:shadow-md
        dark:hover:border-white/[0.25]
        dark:hover:bg-white/[0.06]
        dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
        hover:border-gray-300
        hover:bg-gray-50
        hover:shadow-md
        dark:hover:border-white/[0.25]
        dark:hover:bg-white/[0.06]
        dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
      `}
    >
    <div className="flex items-start justify-between gap-4 overflow-hidden">
        <div>
          <p className="lb-muted text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="lb-text mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
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
      href={href} //changed for layout -prabh
      className=" 
        lb-card
        group
        rounded-2xl
        border border-gray-200 dark:border-white/[0.12]
        bg-white dark:bg-white/[0.03]
        p-5
        backdrop-blur-sm
        transition duration-300
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
        hover:border-gray-300
        hover:bg-gray-50
        hover:shadow-md
        dark:hover:border-white/[0.25]
        dark:hover:bg-white/[0.06]
        dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
      "
    >
      <p className="lb-muted text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
        {label}
      </p>
      <p className="lb-text mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300 transition group-hover:text-gray-900 dark:group-hover:text-white">
        {description}
      </p>
    </Link>
  );
}

function QuotesCard({ orgId }: { orgId: string }) {
  return (
    <Link 
      href={`/quotes?orgId=${orgId}`} //changed for layout- prabh
      className="
        lb-card
        group
        rounded-2xl
        border border-gray-200 dark:border-white/[0.12]
        bg-white dark:bg-white/[0.03]
        p-5
        backdrop-blur-sm
        transition duration-300
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
        hover:bg-gray-50 hover:border-gray-300
        dark:hover:border-white/[0.25]
        dark:hover:bg-white/[0.06]
        dark:hover:shadow-[0_0_35px_rgba(255,255,255,0.12)]
      "
    >
      <p className="lb-muted text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
        Quotes
      </p>
      <p className="lb-muted mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Open
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300 transition group-hover:text-gray-900 dark:group-hover:text-white">
        Review and manage vendor quotes →
      </p>
    </Link>
  );
}

function TransactionsTable({
  title,
  transactions,
  orgId,
  canExport,
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
  canExport: boolean;
}) {
  return (
    <section //changed for layout -prabh
      className="
        lb-card
        rounded-2xl
        border border-gray-200 dark:border-white/[0.12]
        bg-white dark:bg-white/[0.03]
        p-6
        backdrop-blur-sm
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
      "
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/transaction?orgId=${orgId}`}
            className="
              lb-button
              rounded-xl
              border border-white/[0.2]
              bg-white/[0.05]
              px-4 py-2
              text-sm font-medium text-gray-900 dark:text-white
              transition
              hover:border-white/[0.35]
              hover:bg-gray-100 dark:hover:bg-white/[0.08]
            "
          >
            View Transactions
          </Link>

          {canExport && (
            <ExportCSVButton
              orgId={orgId}
              className="
                lb-button
                rounded-xl
                border border-white/[0.2]
                bg-blue-500/[0.05]
                px-4 py-2
                text-sm font-medium text-gray-900 dark:text-white
                transition
                hover:border-white/[0.35]
                hover:bg-gray-100 dark:hover:bg-white/[0.08]
              "
            />
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-neutral-200">
          <thead>
            <tr className="border-b border-white/[0.2] text-left text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-neutral-400">
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
                  lb-row
                  border-b border-white/[0.12]
                  transition
                  hover:bg-gray-50 dark:hover:bg-white/[0.05]
                "
              >
                <td className="py-4 pr-6  text-gray-900 dark:text-white">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="py-4 pr-6 text-gray-900 dark:text-white">{tx.description}</td>
                <td className="py-4 pr-6  text-gray-900 dark:text-white">{tx.category}</td>
                <td className="py-4 pr-6 capitalize  text-gray-900 dark:text-white">
                  {tx.type}
                </td>
                <td className="py-4 text-right font-semibold text-gray-900 dark:text-white">
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

function TasksSection({
  orgId,
  tasks,
  canSeeAllTasks,
  roleOptions,
  selectedRole,
}: {
  orgId: string;
  tasks: DashboardTask[];
  canSeeAllTasks: boolean;
  roleOptions: string[];
  selectedRole: string;
}) {
  return (
    <section //changed for layout - prabh
      className="
        lb-card
        rounded-2xl
        border border-gray-200 dark:border-white/[0.12]
      bg-white dark:bg-white/[0.03]
        p-6
        backdrop-blur-sm
        shadow-[0_0_20px_rgba(255,255,255,0.05)]
      "
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Tasks
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
           Upcoming tasks due soon. View and manage assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
  {canSeeAllTasks && roleOptions.length > 0 && (
    <TaskRoleFilter
      orgId={orgId}
      roleOptions={roleOptions}
      selectedRole={selectedRole}
    />

  )}

  <Link
    href={`/tasks?orgId=${orgId}`}
    className="
      rounded-xl
      border border-white/[0.2]
      bg-white/[0.05]
      px-4 py-2
      text-sm font-medium text-gray-900 dark:text-white
      transition
      hover:border-white/[0.35]
      hover:bg-white/[0.08]
    "
  >
    Open Tasks
  </Link>
</div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-white/[0.12] dark:text-neutral-400">
            No upcoming tasks due within the next two weeks.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="
                rounded-xl border border-gray-200 bg-gray-50 px-4 py-3
                dark:border-white/[0.12] dark:bg-white/[0.03]
              "
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                    Assigned to {task.assigned_to} • {task.task_type}
                  </p>
                </div>

                <p className="text-sm text-gray-600 dark:text-neutral-300">
                  Due {formatDateOnly(task.due_date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function NoOrganizationState() {
  return ( //changed for layout - prabh
    <main className="min-h-screen bg-background text-foreground"> 
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <section
          className="
            w-full rounded-3xl border border-gray-200 dark:border-white/[0.12]
bg-white dark:bg-white/[0.03]
            p-10 text-center backdrop-blur-sm
            shadow-[0_0_20px_rgba(255,255,255,0.05)]
          "
        >
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500 dark:text-neutral-400">
            TreasuryHub
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            You are not in an organization yet
          </h1>

          <p className="mt-4 text-sm text-gray-700 dark:text-neutral-300 sm:text-base">
            Join or create an organization from the home page to start using the dashboard.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="
                lb-button
                inline-flex items-center rounded-xl
              border border-gray-300 dark:border-white/[0.2]
              bg-white dark:bg-white/[0.05]
              px-5 py-3 text-sm font-medium text-gray-900 dark:text-white transition
              hover:bg-gray-100 dark:hover:bg-white/[0.1]
            "
              >
                Sign Out
              </button>
            </form>

            <Link
              href="/organizations"
              className="
                lb-button
                inline-flex items-center rounded-xl
                border border-blue-500
               bg-blue-500
                px-5 py-3 text-sm font-medium text-white transition
               hover:bg-blue-600 hover:border-blue-600
               dark:border-blue-400/30 dark:bg-blue-500/10 dark:hover:bg-blue-500/20
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
  const { orgId, taskRole = "all"} = await searchParams;

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;

  try {
    data = await getDashboardData(orgId);
  } catch {
    return <NoOrganizationState />;
  }

  if (!data || !data.orgId || !data.organizations?.length) {
    return <NoOrganizationState />;
  }

  const currentOrg =
    data.organizations.find((org) => org.org_id === data.orgId) || null;
    const tasksResult = await getTasks(data.orgId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(today.getDate() + 14);

    const canSeeAllTasks = ["treasurer", "advisor", "executive", "admin"].includes(
      data.role.toLowerCase()
    );
    
    const roleOptions = Array.from(
      new Set(
        ((tasksResult.data ?? []) as DashboardTask[])
          .filter((task) => task.assign_type === "role")
          .map((task) => task.assigned_to)
      )
    );
    
    const upcomingTasks = ((tasksResult.data ?? []) as DashboardTask[])
      .filter((task) => {
        if (!task.due_date) return false;
    
        const [year, month, day] = task.due_date.split("-").map(Number);
        const dueDate = new Date(year, month - 1, day);
    
        const isDueSoon = dueDate >= today && dueDate <= twoWeeksFromNow;

        const matchesSelectedRole =
          taskRole === "all" ||
          task.assigned_to.toLowerCase() === taskRole.toLowerCase();

        const memberCanSeeTask =
          task.assign_type === "role" &&
          task.assigned_to.toLowerCase() === data.role.toLowerCase();

        return (
          isDueSoon &&
          (canSeeAllTasks ? matchesSelectedRole : memberCanSeeTask)
        );
      })
      .sort((a, b) => {
        const [ay, am, ad] = (a.due_date as string).split("-").map(Number);
        const [by, bm, bd] = (b.due_date as string).split("-").map(Number);
      
        return (
          new Date(ay, am - 1, ad).getTime() -
          new Date(by, bm - 1, bd).getTime()
        );
      });
  const canAccessFiles = canViewFiles(data.role);
  const canExport = canExportTransactions(data.role);

  return ( //changed for layout - prabh
    <main className="lb-page min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar
          currentUserRole={data.role}
          organizations={data.organizations}
          currentOrgId={data.orgId}
          currentOrgName={
            data.organizations.find(org => org.org_id === data.orgId)?.org_name || "Unknown Org"
          }
          basePath="/"
          logoSrc={currentOrg?.logo_url || null}
          pageTitle="Dashboard"
        />
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {data.scope === "organization" ? (
          <div className="space-y-8">
            <section
              className={`grid gap-4 md:grid-cols-2 ${canAccessFiles ? "xl:grid-cols-7" : "xl:grid-cols-6"
                }`}
            >
              <StatCard
                label="Income"
                value={formatCurrency(data.summary.income)}
                icon={<DollarSign className="h-5 w-5" />}
                accent="bg-green-100 text-green-600"
                hoverAccent="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-emerald-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard
                label="Expenses"
                value={formatCurrency(data.summary.expenses)}
                icon={<TrendingDown className="h-5 w-5" />}
                accent="bg-rose-100 text-rose-600"
                hoverAccent="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-rose-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard 
                label="Net" 
                value={formatCurrency(data.summary.net)} 
                icon={<Wallet className="h-5 w-5" />}
                accent="bg-violet-100 text-violet-600"
                hoverAccent="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-violet-50 dark:hover:bg-white/[0.06]"
              />

              <LinkCard
                href={`/transaction?orgId=${data.orgId}`}
                label="Transactions"
                title={String(data.summary.transactionCount)}
                description="View recent transactions →"
              />

              <LinkCard
                href={`/audit?orgId=${data.orgId}`}
                label="Audit"
                title={String(data.summary.auditCount)}
                description="Review recent audit activity →"
              />

              <QuotesCard orgId={data.orgId} />

              {canAccessFiles && (
                <LinkCard
                  href={`/files?orgId=${data.orgId}`}
                  label="Files"
                  title="Open"
                  description="View and manage organization files →"
                />
              )}
            </section>
            
            <TasksSection
              orgId={data.orgId}
              tasks={upcomingTasks}
              canSeeAllTasks={canSeeAllTasks}
              roleOptions={data.roleOptions}
              selectedRole={taskRole}
              />
            <TransactionsTable
              title="Recent Organization Transactions"
              transactions={data.recentTransactions}
              orgId={data.orgId}
              canExport={canExport}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Reimbursements"
                value={formatCurrency(data.summary.reimbursementsTotal)}
                icon={<DollarSign className="h-5 w-5" />}
                accent="bg-emerald-100 text-emerald-600"
                hoverAccent="dark:hover:bg-emerald-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard
                label="Payables"
                value={formatCurrency(data.summary.payablesTotal)}
                icon={<TrendingDown className="h-5 w-5" />}
                accent="bg-rose-100 text-rose-600"
                hoverAccent="dark:hover:bg-rose-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard
                label="Receivables"
                value={formatCurrency(data.summary.receivablesTotal)}
                icon={<Wallet className="h-5 w-5" />}
                accent="bg-violet-100 text-violet-600"
                hoverAccent="dark:hover:bg-violet-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard
                label="Transactions"
                value={data.summary.personalTransactionCount}
                icon={<ReceiptText className="h-5 w-5" />}
                accent="bg-blue-100 text-blue-600"
                hoverAccent="dark:hover:bg-blue-50 dark:hover:bg-white/[0.06]"
              />
              <StatCard
                label="Uploaded Files"
                value={data.summary.uploadedFilesCount}
                icon={<Upload className="h-5 w-5" />}
                accent="bg-sky-100 text-sky-600"
                hoverAccent="dark:hover:bg-sky-50 dark:hover:bg-white/[0.06]"
              />
            </section>

            <TasksSection
              orgId={data.orgId}
              tasks={upcomingTasks} 
              canSeeAllTasks={canSeeAllTasks}
              roleOptions={data.roleOptions}
              selectedRole={taskRole}
              />
            <TransactionsTable
              title="My Recent Transactions"
              transactions={data.recentTransactions}
              orgId={data.orgId}
              canExport={canExport}
            />
          </div>
        )}
      </div>
    </main>
  );
}