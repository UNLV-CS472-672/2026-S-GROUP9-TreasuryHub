"use client"

import { useState } from "react"
import { requestPasswordReset } from "./actions"
import BackButton from "@/components/BackButton"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setError("")

        if (!email.trim()) {
            setError("Please enter an email")
            return
        }

        setLoading(true)
        const result = await requestPasswordReset(email)
        setLoading(false)

        if (result?.error) {
            // We still show success even on most errors to avoid leaking
            // whether the email exists in our system (per UC1 validation rules)
            setSuccess(true)
            return
        }

        setSuccess(true)
    }

    if (success) {
        return (
            <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
                <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                        TreasuryHub
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
                        Check your inbox
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                        If that email is registered, a password reset link has been sent.
                    </p>
                    <BackButton label="Back to Login" />
                </section>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                    TreasuryHub
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
                    Reset your password
                </h1>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                    Enter your account email and we'll send you a link to reset your password.
                </p>

                <div className="flex flex-col gap-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Email"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                    <BackButton label="Cancel" />
                </div>

                {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>}
            </section>
        </main>
    )
}