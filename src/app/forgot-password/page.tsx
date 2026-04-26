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
            <div className="mt-10 flex flex-col items-center gap-4">
                <p className="text-green-500 text-center max-w-md">
                    If that email is registered, a password reset link has been sent.
                    Check your inbox.
                </p>
                <BackButton label="Back to Login" />
            </div>
        )
    }

    return (
        <div>
            <div className="mt-5 flex flex-col items-center justify-center gap-3">
                <h1 className="text-xl font-semibold mb-2">Reset your password</h1>
                <p className="text-sm text-neutral-400 max-w-sm text-center mb-2">
                    Enter your account email and we&apos;ll send you a link to reset your password.
                </p>

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 rounded p-2 w-72 text-gray-900 bg-gray-100 focus:border-blue-500 focus:outline-none dark:border-white/[0.2] dark:bg-white/[0.05] dark:text-white"
                    placeholder="Email"
                />

                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="border border-gray-300 rounded p-2 text-gray-900 hover:bg-gray-100 disabled:opacity-50 dark:border-white/[0.2] dark:text-white dark:hover:bg-white/[0.1]"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                    <BackButton label="Cancel" />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    )
}