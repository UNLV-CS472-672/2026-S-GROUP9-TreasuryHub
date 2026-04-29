"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "./actions"

type SkeletonPulseProps = { className?: string }
function SkeletonPulse({ className = "" }: SkeletonPulseProps) {
    return (
        <div className={`animate-pulse rounded bg-gray-200 dark:bg-white/[0.08] ${className}`} />
    )
}

const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setLoading(true)
        try {
            const result = await signIn(email, password)
            if (result?.error) {
                setError(result.error)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <title>Login | TreasuryHub</title>
            <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                    TreasuryHub
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
                    Sign in
                </h1>

                {loading ? (
                    <div className="flex flex-col gap-3">
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                        <SkeletonPulse className="h-10 w-full" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
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
                        <button
                            onClick={handleSubmit}
                            className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                        >
                            Login
                        </button>
                    </div>
                )}

                {error && (
                    <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>
                )}

                <div className="mt-5 flex flex-col gap-2 text-center text-sm">
                    <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Don&apos;t have an account? Register
                    </Link>
                    <Link href="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline">
                        Forgot your password?
                    </Link>
                </div>
            </section>
        </main>
    )
}
