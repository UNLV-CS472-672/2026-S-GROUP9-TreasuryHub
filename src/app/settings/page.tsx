import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { updateDisplayName } from "./actions"
import ThemeToggle from "@/components/ThemeToggle"

// Account-level settings page (not org-scoped).
// Lives at /settings, accessible from the navbar regardless of which org the
// user is currently viewing.
//
// What this page does:
//   - Display the user's email (read-only; email change deferred)
//   - Update display name
//   - Toggle theme (light/dark)
//   - Link to password reset flow (built in PR #66)
//
// Deferred to follow-up PRs:
//   - Email change (needs double-confirmation flow)
//   - Account deletion (needs admin RPC, can't be done from anon client)
//   - Time zone preference (needs schema change)
export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }

    // Pull display_name from public.users (auth.users only has email + metadata)
    const { data: profile } = await supabase
        .from("users")
        .select("display_name, email")
        .eq("user_id", user.id)
        .maybeSingle()

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-2xl px-6 py-10">
                <div className="mb-8">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                        Account Settings
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Your Account
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        Manage your profile, appearance, and password.
                    </p>
                </div>

                {/* Profile info */}
                <section className="mb-6 rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6">
                    <h2 className="mb-4 text-lg font-semibold">Profile</h2>

                    <div className="mb-5">
                        <label className="mb-2 block text-sm text-neutral-600 dark:text-neutral-300">
                            Email
                        </label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {profile?.email ?? user.email}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                            Email change is not yet available.
                        </p>
                    </div>

                    <form action={updateDisplayName} className="space-y-3">
                        <label className="mb-1 block text-sm text-neutral-600 dark:text-neutral-300">
                            Display name
                        </label>
                        <input
                            name="displayName"
                            type="text"
                            defaultValue={profile?.display_name ?? ""}
                            required
                            maxLength={100}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none dark:border-white/[0.15] dark:bg-white/[0.05] dark:text-white"
                        />
                        <button
                            type="submit"
                            className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-500/20 dark:text-white"
                        >
                            Save name
                        </button>
                    </form>
                </section>

                {/* Appearance */}
                <section className="mb-6 rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6">
                    <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Theme</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Switch between light and dark mode.
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </section>

                {/* Security */}
                <section className="mb-6 rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6">
                    <h2 className="mb-4 text-lg font-semibold">Security</h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Password</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Reset your password via email.
                            </p>
                        </div>
                        <Link
                            href="/forgot-password"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-white/[0.15] dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
                        >
                            Reset password
                        </Link>
                    </div>
                </section>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                        &larr; Back to dashboard
                    </Link>
                </div>
            </div>
        </main>
    )
}