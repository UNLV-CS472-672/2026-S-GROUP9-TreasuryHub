// skeleton components during loading for transaction page

import TransactionTable from "./ui/table";

// base function used by all other skeleton components
function SkeletonPulse({ className = "" }: { className?: string }){
    return(
        <div className={`animate-pulse rounded-md bg-white/[0.07] ${className}`} />
    );
}

// PageHeaderSkeleton - placeholder for the page header
function PageHeaderSkeleton(){
    return(
        <div className="flex items-center justify-between">
            <div>
                <SkeletonPulse className="h-7 w-40 mb-1" />
                <SkeletonPulse className="h-4 w-64" />
            </div>
            
            <SkeletonPulse className="h-10 w-44 rounded-xl" />
        </div>
    );
}


// Number of placeholder rows. Matches a typical page size so the section height is stable and the page doesn't reflow when data loads
const TABLE_ROW_COUNT = 10;

const COLUMNS: { label: string; width: string; align?: "right" }[] = [
    { label: "Date",        width: "w-24" },
    { label: "Description", width: "w-56" },
    { label: "Category",    width: "w-28" },
    { label: "Type",        width: "w-20" },
    { label: "Amount",      width: "w-20", align: "right" },
    { label: "Status",      width: "w-24" },
    { label: "Actions",     width: "w-8",  align: "right" },
];

// TransactionTableSkeleton - placeholder for the <TransactionTable> component
function TransactionsTableSkeleton(){
    return(
        <div
            className="
                rounded-2x1
                border border-white/[0.12]
                bg-white/[0.03]
                backdrop-blur-sm
                shadow-[0_0_20px_rgba(255,255,255,0.05)]
                overflow-hidden
            "
        >
            <div className="flex items-center justify-between gap-4 p-4 border-b border-white/[0.08]">
                <SkeletonPulse className="h-9 w-56 rounded-xl" />
                <div className="flex items-center gap-2">
                    <SkeletonPulse className="h-9 w-24 rounded-xl" />
                    <SkeletonPulse className="h-9 w-24 rounded-xl" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/[0.12]">
                            {COLUMNS.map(({ label, align }) => (
                                <th
                                    key={label}
                                    className={`
                                        px-4 py-3
                                        text-xs uppercase tracking-[0.16em]
                                        text-neutral-500 font-medium
                                        ${align === "right" ? "text-right" : "text-left"}
                                    `}
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    
                    {/* shimmer stuff */}
                    <tbody>
                        {Array.from({ length: TABLE_ROW_COUNT }).map((_, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-white/[0.06] last:border-0"
                            >
                                {COLUMNS.map(({ label, width, align }) => (
                                    <td
                                        key={label}
                                        className={`px-4 py-3 ${align === "right" ? "text-right" : ""}`}
                                    >
                                        <SkeletonPulse className={`h-4 ${width} ${align === "right" ? "ml-auto" : ""}`}
                                    />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* mimics row count label */}
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/[0.08]">
                <SkeletonPulse className="h-4 w-28" />
                {/* next buttons */}
                <div className="flex items-center gap-2">
                    <SkeletonPulse className="h-8 w-20 rounded-xl" />
                    <SkeletonPulse className="h-8 w-16 rounded-xl" />
                    <SkeletonPulse className="h-8 w-20 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// TransactionPageLoading — the default export consumed by Next.js as the Suspense fallback for the /transaction route
export default function TransactionPageLoading(){
    return(
        <main className="max-w-7x1 mx-auto px-4 py-8 pb-16">
            <div className="space-y-6">
                <PageHeaderSkeleton />
                <TransactionsTableSkeleton />
            </div>
        </main>
    );
}
