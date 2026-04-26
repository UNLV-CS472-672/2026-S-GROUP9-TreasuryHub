"use client"

import { useDebugValue, useEffect, useState, Suspense } from "react"
import { addQuote, getQuotes, acceptQuote, deleteQuote } from "./actions"
import BackButton from "@/components/BackButton"
import { Skeleton } from "@/components/Skeleton"
import { useSearchParams } from "next/navigation"

// The Treasurer/Admin can view and review uploaded quotes for products 
// or services for a certain event with an established budget. They can 
// evaluate available options and publish the selected quote to propose 
// during budget planning and purchasing decisions.  

function QuotesPageContent() {
    const [quotes, setQuotes] = useState<{
        quotes_id: number
        vendor: string
        memo: string
        amount: number
        accepted: boolean
    }[]>([])

    // Grab the organization ID from the search parameters
    const searchParams = useSearchParams();
    const orgID = searchParams.get('orgId');

    const [vendor, setVendor] = useState("")
    const [memo, setMemo] = useState("")
    const [amount, setAmount] = useState("")
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const [confirmingId, setConfirmingId] = useState<number | null>(null)

    // delete quote
    async function handleDeleteQuote(id: number) {
        const result = await deleteQuote(id)
        if (result?.error) {
            setError(result.error)
        } else {
            setQuotes(quotes.filter((q) => q.quotes_id !== id))
        }
    }

    async function fetchQuotes() {
        if (!orgID) return;

        const result = await getQuotes(orgID)
        if (result?.error) {
            setError(result.error)
        } else if (result?.data) {
            setQuotes(result.data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchQuotes()
    }, [])

    async function handleAddQuote() {
        if (!vendor || !memo || !amount || !orgID) return
        const result = await addQuote(vendor, memo, parseFloat(amount), orgID);

        if (result?.error) {
            setError(result.error);
        }
        else {
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
        <div className="max-w-xl mxx-auto p-6">
            <h1 className="text-xl font-medium mb-6">Quotes</h1>

            {/* quote form */}
            <div className="flex flex-col gap-3 mb-8">
                <input
                    type="text"
                    placeholder="Vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm"
                />
                <textarea
                    placeholder="Memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm resize-none"
                    rows={3}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border border-gray-300 rounded p-2 text-sm"
                />
                <button
                    onClick={handleAddQuote}
                    className="bg-black text-white text-sm rounded p-2"
                >
                    Add Quote
                </button>
                <BackButton />
            </div>

            {/* display the quotes/memos */}
            {/* checks for loading and should add a skeleton until loaded */}
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                        <div className="flex flex-col gap-2">
                            <Skeleton width={120} height={14} />
                            <Skeleton width={200} height={12} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton width={48} height={14} />
                            <Skeleton width={60} height={26} rounded="sm" />
                            <Skeleton width={60} height={26} rounded="sm" />
                        </div>
                    </div>
                ))
            ) : (
                <>
                    {quotes.length === 0 && (
                        <p className="text-sm text-gray-400">No quotes yet.</p>
                    )}
 
            {quotes.map((q) => (
                <div key={q.quotes_id} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div>
                        <p className="text-sm font-medium">{q.vendor}</p>
                        <p className="text-xs text-gray-500">{q.memo}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm">${q.amount.toLocaleString()}</span>
 
                        {/* after the quote is accepted, button changes to a label */}
                        {!q.accepted ? (
                            <button
                                onClick={() => handleAcceptQuote(q.quotes_id)}
                                className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-500"
                            >
                                Accept
                            </button>
                        ) : (
                            <span className="text-xs text-green-700">Accepted</span>
                        )}
 
                        {confirmingId === q.quotes_id ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        handleDeleteQuote(q.quotes_id)
                                        setConfirmingId(null)
                                    }}
                                    className="text-xs px-3 py-1 rounded border border-red-400 text-red-500"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setConfirmingId(null)}
                                    className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmingId(q.quotes_id)}
                                className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-400"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            ))}
                </>
            )}
        </div>
    )
}

// Suspense boundary for useSearchParams()
export default function QuotesPage() {
        return (
            <Suspense
                fallback={
                    <div className="p-8 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton width={64} height={28} />
                            <Skeleton width={112} height={38} rounded="sm" />
                        </div>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex gap-2">
                                <Skeleton width={56} height={38} rounded="sm" />
                                <Skeleton width={72} height={38} rounded="sm" />
                                <Skeleton width={88} height={38} rounded="sm" />
                            </div>
                        </div>
                        <ul className="divide-y border rounded-lg">
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
                }
            >
                <QuotesPageContent />
            </Suspense>
        )
}