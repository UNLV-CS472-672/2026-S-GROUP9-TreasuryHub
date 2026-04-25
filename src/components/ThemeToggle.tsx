"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "treasuryhub-theme"

// Reads the currently-applied theme by checking the html element's class.
// We don't read from localStorage here because the inline script in layout.tsx
// has already applied the correct theme before this component mounts.
function getCurrentTheme(): Theme {
    if (typeof document === "undefined") return "light"
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    if (theme === "dark") {
        root.classList.add("dark")
    } else {
        root.classList.remove("dark")
    }
    try {
        localStorage.setItem(STORAGE_KEY, theme)
    } catch {
        // localStorage might be blocked (private mode etc); theme just won't persist
    }
}

export default function ThemeToggle() {
    // null until mounted, so server render and first client render match.
    // Without this we'd get a hydration mismatch when the saved theme
    // differs from the server-rendered default.
    const [theme, setTheme] = useState<Theme | null>(null)

    useEffect(() => {
        setTheme(getCurrentTheme())
    }, [])

    function toggle() {
        const next: Theme = theme === "dark" ? "light" : "dark"
        applyTheme(next)
        setTheme(next)
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-100 dark:border-white/[0.15] dark:bg-white/[0.05] dark:text-white dark:hover:bg-white/[0.08]"
        >
            {theme === null ? "..." : theme === "dark" ? "Switch to light" : "Switch to dark"}
        </button>
    )
}