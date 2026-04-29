"use client"

import { useState } from "react"
import Link from "next/link"
import { signUp } from "./actions"

type SkeletonPulseProps = { className?: string }
function SkeletonPulse({ className = "" }: SkeletonPulseProps) {
    return (
        <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/[0.08] ${className}`} />
    )
}

const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function RegistrationPage() {
    const [email, setEmail] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }
        setError("")
        setLoading(true)
        const result = await signUp(email, password, displayName)
        setLoading(false)
        if (result?.error) {
            setError(result.error)
        }
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                    TreasuryHub
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
                    Create account
                </h1>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={inputClass}
                            placeholder="Display Name"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputClass}
                            placeholder="Email"
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                            placeholder="Password"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputClass}
                            placeholder="Confirm Password"
                        />
                        <button
                            onClick={handleSubmit}
                            className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                        >
                            Register
                        </button>
                    </div>
                )}

                {error && (
                    <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
                )}

                <div className="mt-5 text-center text-sm">
                    <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Already have an account? Sign in
                    </Link>
                </div>
            </section>
        </main>
    )
}
