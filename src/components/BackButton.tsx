"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ label = "Go Back" }: { label?: string }) {
    const router = useRouter();

    return (
        <button
        // changed to make it visible in white mode - prabh--
            onClick={() => router.push("/dashboard")}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 active:scale-95 dark:border-white/[0.2] dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
        > 
            {label}
        </button>
    );
}