import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit" };

export default function AuditLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}