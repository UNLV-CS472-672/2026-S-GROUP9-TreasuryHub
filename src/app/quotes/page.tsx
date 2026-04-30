"use client"

import { useEffect, useState, Suspense } from "react"
import { addQuote, getQuotes, acceptQuote, deleteQuote, getCurrentUserRole } from "./actions"
import BackButton from "@/components/BackButton"
import { Skeleton } from "@/components/Skeleton"
import { useSearchParams } from "next/navigation"

const VIEW_ROLES = ["executive", "advisor", "treasury_team", "treasurer", "admin"]
const MANAGE_ROLES = ["treasury_team", "treasurer", "admin"]
const DELETE_ROLES = ["treasurer", "admin"]

type SkeletonPulseProps = { className?: string }
function SkeletonPulse({ className = "" }: SkeletonPulseProps) {
    return (
        <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/[0.08] ${className}`} />
    )
}

function QuotesPageContent() {
    const [quotes, setQuotes] = useState<{
        quotes_id: number
        vendor: string
        memo: string
        amount: number
        accepted: boolean
    }[]>([])

    const searchParams = useSearchParams()
    const orgID = searchParams.get('orgId')

    const [vendor, setVendor] = useState("")
    const [memo, setMemo] = useState("")
    const [amount, setAmount] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [confirmingId, setConfirmingId] = useState<number | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

    const canView = !!userRole && VIEW_ROLES.includes(userRole.toLowerCase())
    const canManage = !!userRole && MANAGE_ROLES.includes(userRole.toLowerCase())
    const canDelete = !!userRole && DELETE_ROLES.includes(userRole.toLowerCase())

    async function handleDeleteQuote(id: number) {
        const result = await deleteQuote(id)
        if (result?.error) {
            setError(result.error)
        } else {
            setQuotes(quotes.filter((q) => q.quotes_id !== id))
        }
    }

    async function fetchQuotes() {
        if (!orgID) {
            setLoading(false);
            return;
        }
        try {
            const result = await getQuotes(orgID);
            if (result?.error) {
                setError(result.error);
            } else if (result?.data) {
                setQuotes(result.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load quotes");
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserRole() {
        if (!orgID) return
        const role = await getCurrentUserRole(orgID)
        setUserRole(role)
    }

    useEffect(() => {
        fetchQuotes()
        fetchUserRole()
    }, [])

    async function handleAddQuote() {
        if (!vendor || !memo || !amount || !orgID) return
        const result = await addQuote(vendor, memo, parseFloat(amount), orgID)
        if (result?.error) {
            setError(result.error)
        } else {
            await fetchQuotes()
            setVendor("")
            setMemo("")
            setAmount("")
        }
    }

    async function handleAcceptQuote(id: number) {
        const confirmed = window.confirm("Accept this quote?")
        if (!confirmed) return
        const result = await acceptQuote(id)
        if (result?.error) {
            setError(result.error)
        } else {
            setQuotes(quotes.map((q) =>
                q.quotes_id === id ? { ...q, accepted: true } : q
            ))
        }
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Quotes</h1>
                    <BackButton />
                </div>

                {/* Access denied state - only show after role has been fetched */}
                {!loading && userRole !== null && !canView && (
                    <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 text-center backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Access denied
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-neutral-400">
                            You don&apos;t have permission to view quotes for this organization.
                        </p>
                    </section>
                )}

                {/* Main content - show during loading, while role resolves, or if user can view */}
                {(loading || userRole === null || canView) && (
                    <>
                        {/* Add Quote Form (only for users with manage permission) */}
                        {(loading || userRole === null || canManage) && (
                            <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] mb-8">
                                <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Add Quote</h2>

                                <div className="flex flex-col gap-3">
                                    {loading ? (
                                        <>
                                            <SkeletonPulse className="h-9 w-full" />
                                            <SkeletonPulse className="h-20 w-full" />
                                            <SkeletonPulse className="h-9 w-full" />
                                            <SkeletonPulse className="h-9 w-24" />
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Vendor"
                                                value={vendor}
                                                onChange={(e) => setVendor(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <textarea
                                                placeholder="Memo"
                                                value={memo}
                                                onChange={(e) => setMemo(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                rows={3}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={handleAddQuote}
                                                className="self-start rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                                            >
                                                Add Quote
                                            </button>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div className="mb-8 flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                                <span>{error}</span>
                                <button
                                    onClick={() => setError("")}
                                    className="text-red-700 dark:text-red-300 hover:opacity-70"
                                    aria-label="Dismiss error"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {/* Quotes List */}
                        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.08]">
                                <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Submitted Quotes</h2>
                            </div>

                            {loading ? (
                                <div className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex justify-between items-center px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <SkeletonPulse className="h-4 w-28" />
                                                <SkeletonPulse className="h-3 w-48" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <SkeletonPulse className="h-4 w-12" />
                                                <SkeletonPulse className="h-7 w-16 rounded" />
                                                <SkeletonPulse className="h-7 w-16 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : quotes.length === 0 ? (
                                <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
                                    No quotes yet.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                                    {quotes.map((q) => (
                                        <li key={q.quotes_id} className="flex justify-between items-center px-6 py-4 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{q.vendor}</p>
                                                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{q.memo}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    ${q.amount.toLocaleString()}
                                                </span>

                                                {!q.accepted ? (
                                                    canManage && (
                                                        <button
                                                            onClick={() => handleAcceptQuote(q.quotes_id)}
                                                            className="rounded-xl border border-gray-200 dark:border-white/[0.12] px-3 py-1 text-xs font-medium text-gray-600 dark:text-neutral-300 transition hover:border-green-400 hover:text-green-600 dark:hover:text-green-400"
                                                        >
                                                            Accept
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Accepted</span>
                                                )}

                                                {canDelete && (
                                                    confirmingId === q.quotes_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => { handleDeleteQuote(q.quotes_id); setConfirmingId(null) }}
                                                                className="rounded-xl border border-red-400/50 px-3 py-1 text-xs font-medium text-red-500 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmingId(null)}
                                                                className="rounded-xl border border-gray-200 dark:border-white/[0.12] px-3 py-1 text-xs font-medium text-gray-500 dark:text-neutral-400 transition hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmingId(q.quotes_id)}
                                                            className="rounded-xl border border-gray-200 dark:border-white/[0.12] px-3 py-1 text-xs font-medium text-gray-500 dark:text-neutral-400 transition hover:border-red-400/50 hover:text-red-500 dark:hover:text-red-400"
                                                        >
                                                            Delete
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    )
}

export default function QuotesPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-background text-foreground">
                    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <Skeleton width={80} height={28} />
                            <Skeleton width={80} height={36} rounded="sm" />
                        </div>
                        <ul className="divide-y border rounded-2xl">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <li key={i} className="flex items-center justify-between p-4">
                                    <div className="flex flex-col gap-2">
                                        <Skeleton width={200} height={16} />
                                        <Skeleton width={140} height={13} />
                                    </div>
                                    <Skeleton width={36} height={14} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </main>
            }
        >
            <QuotesPageContent />
        </Suspense>
    )
}