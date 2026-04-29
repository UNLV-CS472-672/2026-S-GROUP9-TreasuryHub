import Form from 'next/form'
import { createOrganization } from "./actions";
import Link from "next/link";

export const metadata = { title: "New Organization" };

export default function NewOrganization() {
    return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <section className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400 mb-1">
                    TreasuryHub
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-6">
                    New Organization
                </h1>

                <Form action={createOrganization} className="flex flex-col gap-3">
                    <input
                        name="organizationName"
                        type="text"
                        required
                        placeholder="Organization name"
                        className="w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="w-full rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                    >
                        Create Organization
                    </button>
                    <Link
                        href="/organizations"
                        className="w-full rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.05] px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
                    >
                        Go Back
                    </Link>
                </Form>
            </section>
        </main>
    );
}
