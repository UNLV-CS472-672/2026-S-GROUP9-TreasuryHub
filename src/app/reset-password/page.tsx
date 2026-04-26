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
        <div>
            <div className="mt-5 flex flex-col items-center justify-center gap-3">
                <h1 className="text-xl font-semibold mb-2">Set a new password</h1>
                <p className="text-sm text-neutral-400 max-w-sm text-center mb-2">
                    Choose a new password for your account. You&apos;ll be redirected to login after.
                </p>

                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-gray-300 rounded p-2 w-72 text-gray-900 bg-gray-100 focus:border-blue-500 focus:outline-none dark:border-white/[0.2] dark:bg-white/[0.05] dark:text-white"
                    placeholder="New password"
                />

                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border border-gray-300 rounded p-2 w-72 text-gray-900 bg-gray-100 focus:border-blue-500 focus:outline-none dark:border-white/[0.2] dark:bg-white/[0.05] dark:text-white"
                    placeholder="Confirm new password"
                />

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="border border-gray-300 rounded p-2 text-gray-900 hover:bg-gray-100 disabled:opacity-50 dark:border-white/[0.2] dark:text-white dark:hover:bg-white/[0.1]"
                >
                    {loading ? "Updating..." : "Update password"}
                </button>

                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    )
}