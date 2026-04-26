import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quotes" };

export default function QuotesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}