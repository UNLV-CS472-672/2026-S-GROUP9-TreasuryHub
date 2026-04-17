"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ label = "Go Back" }: { label?: string }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/dashboard")}
            className="border border-white bg-black-600 text-white px-4 py-2 rounded hover:bg-gray-700 active:scale-95 transition-all"
        >
            {label}
        </button>
    );
}