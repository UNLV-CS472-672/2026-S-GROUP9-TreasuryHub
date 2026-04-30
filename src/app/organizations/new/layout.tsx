import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Organization" };

export default function FilesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}