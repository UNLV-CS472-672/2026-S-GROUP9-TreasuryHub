"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: "sm" | "md" | "lg" | "full";
}
 
export function Skeleton({
    className = "",
    width,
    height,
    rounded = "md"
}: SkeletonProps) {
    const radiusMap = {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        full: "9999px",
    };
    return (
        <div
            className={`skeleton-pulse ${className}`}
            style={{
                width,
                height,
                borderRadius: radiusMap[rounded],
                backgroundColor: "var(--skeleton-base)",
                backgroundImage:
                "linear-gradient(90deg, var(--skeleton-base) 25%, var(--skeleton-highlight) 50%, var(--skeleton-base) 75%)",
                backgroundSize: "200% 100%",
                animation: "skeleton-shimmer 1.5s infinite linear",
                display: "block",
            }}
        />
    );
}

export default Skeleton;