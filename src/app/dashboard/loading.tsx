// skeleton components during loading for dashboard

// base function used by all other skeleton components
function SkeletonPulse({ className = "" }: { className?: string }) {
    return(
        <div
            className={`animate-pulse rounded-md bg-white/[0.07] ${className}`}
        />
    );
}

// StatCardSkeleton - placeholder for the <StatCard> component
function StatCardSkeleton(){
    return(
        <div
            className="
                rounded-2x1
                border border-white/[0.12]
                bg-white/[0.03]
                p-5
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(255,255,255,0.05)]
            "
        >
            <SkeletonPulse className="h-3 w-20" />          {/* label */}
            <SkeletonPulse className="mt-3 h-7 w-28" />
        </div>
    );
}

// LinkCardSkeleton - placeholder for the <LinkCard> and <QuotesCard>
function LinkCardSkeleton(){
    return(
        <div
            className="
                rounded-2x1
                border border-white/[0.12]
                bg-white/[0.03]
                p-5
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(255,255,255,0.05)]
            "
        >
            <SkeletonPulse className="h-3 w-14" />          {/* label */}
            <SkeletonPulse className="mt-3 h-7 w-20" />
            <SkeletonPulse className="mt-2 h-4 w-40" />
        </div>
    );
}

// TransactionsTableSkeleton - placeholder for the <TransactionsTable>
function TransactionsTableSkeleton({ title }: { title: string }){
    return(
        <section
            className="
                rounded-2x1
                border border-white/[0.12]
                bg-white/[0.03]
                p-6
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(255.255,255,0.05)]
            "
        >
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                    {title}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                    <SkeletonPulse className="h-9 w-36 rounded-xl" />
                    <SkeletonPulse className="h-9 w-28 rounded-xl" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/[0.2]">
                            {["Date", "Description", "Category", "Type", "Amount"].map(
                                (col) => (
                                    <th
                                        key={col}
                                        className="py-3 pr-6 text-left text-xs uppercase tracking-[0.16em] text-neutral-500 font-medium last:text-right last:pr-0"
                                    >
                                        {col}
                                    </th>
                                )
                            )}
                        </tr>
                    </thead>
                    
                    <tbody>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <tr
                                key={i}
                                className="border-b border-white/[0.08]"
                            >
                                <td className="py-4 pr-6">
                                    <SkeletonPulse className="h-4 w-20" />
                                </td>
                                <td className="py-4 pr-6">
                                    <SkeletonPulse className="h-4 w-48" />
                                </td>
                                <td className="py-4 pr-6">
                                    <SkeletonPulse className="h-4 w-24" />
                                </td>
                                <td className="py-4 pr-6">
                                    <SkeletonPulse className="h-4 w-16" />
                                </td>
                                <td className="py-4 flex justify-end">
                                    <SkeletonPulse className="h-4 w-20" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// TasksSectionSkeleton - placeholder for the <TasksSection> component
function TasksSectionSkeleton(){
    return(
        <section
            className="
                rounded-2x1
                border border-white/[0.12]
                bg-white/[0.03]
                p-6
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(255,255,255,0.05)]
            "
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                    <SkeletonPulse className="h-5 w-16" />
                    <SkeletonPulse className="mt-2 h-4 w-56" />
                </div>
                <SkeletonPulse className="h-9 w-28 rounded-xl" />
            </div>

            <div className="rounded-xl border border-dashed border-white/[0.12] px-4 py-6">
                <SkeletonPulse className="h-4 w-72 mx-auto" />
            </div>
        </section>
    );
}

// NavbarSkeleton - placeholder for the <Navbar> component
function NavbarSkeleton(){
    return(
        <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <SkeletonPulse className="h-8 w-8 rounded-lg" />
                <SkeletonPulse className="h-5 w-24" />
            </div>

            <div className="flex items-center gap-4">
                <SkeletonPulse className="h-8 w-36 rounded-xl" />
                <SkeletonPulse className="h-8 w-24 rounded-xl" />
                <SkeletonPulse className="h-8 w-8 rounded-full" />
            </div>
        </div>
    );
}

// DashboardLoading - the default export by Next.js as the Suspense
export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <NavbarSkeleton />
 
        <div className="space-y-8">
          {/* Stat + link cards — matches the 7-column org layout (widest case) */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <LinkCardSkeleton />
            <LinkCardSkeleton />
            <LinkCardSkeleton />
          </section>
 
          <TransactionsTableSkeleton title="Recent Organization Transactions" />
 
          <TasksSectionSkeleton />
        </div>
      </div>
    </main>
  );
}
