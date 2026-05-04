"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updatePassword } from "./actions"
import { isValidPassword } from "@/lib/authValidation"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setError("")

        if (!isValidPassword(password)) {
            setError("Password must be at least 8 characters")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)
        const result = await updatePassword(password)
        setLoading(false)

        if (result?.error) {
            setError(result.error)
            return
        }

        // Password updated. Sign-out happens server-side so the user
        // logs in fresh with the new password.
        router.push("/login")
    }

    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                    TreasuryHub
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
                    Set a new password
                </h1>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                    Choose a new password for your account. You&apos;ll be redirected to login after.
                </p>

                <div className="flex flex-col gap-3">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="New password"
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Update password"}
                    </button>
                </div>

                {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>}
            </section>
        </main>
    )
}