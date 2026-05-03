"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "lightbright"

const STORAGE_KEY = "treasuryhub-theme"

// Reads the currently-applied theme by checking the html element's class.
// We don't read from localStorage here because the inline script in layout.tsx
// has already applied the correct theme before this component mounts.
function getCurrentTheme(): Theme {
    if (typeof document === "undefined") return "light"
    const root = document.documentElement

    if (root.classList.contains("dark")) return "dark"
    if (root.classList.contains("lightbright")) return "lightbright"

    return "light"
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    
    root.classList.remove("light", "dark", "lightbright")
    root.classList.add(theme)

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

    function setSelectedTheme(next: Theme) {
        applyTheme(next)
        setTheme(next)
    }

    return (
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm">
      {(["light", "lightbright", "dark"] as Theme[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setSelectedTheme(option)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            theme === option
              ? "bg-amber-100 text-amber-700"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.08]"
          }`}
        >
          {option === "lightbright"
            ? "LightBright"
            : option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
    )
}