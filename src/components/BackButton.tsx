"use client";
import { useRouter } from "next/navigation";

export default function BackButton({ 
    label = "Go Back",
    fallbackPath = "/dashboard" 
}: { 
    label?: string;
    fallbackPath?: string;
}) {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackPath);
        }
    };

    return (
        <button onClick={handleBack} className="border border-white bg-black-600 text-white px-4 py-2 rounded hover:bg-gray-700 active:scale-95 transition-all">
            {label}
        </button>
    );
}