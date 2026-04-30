'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { type OrgOptions } from '@/app/transaction/lib/schemas';

type Props = {
  organizations: {
    org_id: string
    org_name: string
    role: string
  }[]
  currentOrgId: string
  basePath: string // e.g. '/dashboard' or '/files'
}

export default function OrgDropDown({ organizations, currentOrgId, basePath }: Props) {
  // Hide entirely if user has only one org (no other orgs to switch to)
  if (organizations.length <= 1) return null;

  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const otherOrgs = organizations.filter((org) => org.org_id !== currentOrgId)

  const filtered = query.trim()
    ? otherOrgs.filter((org) =>
      org.org_name.toLowerCase().includes(query.toLowerCase())
    )
    : otherOrgs

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const handleSelect = (orgId: string) => {
    setOpen(false)
    setQuery('')
    router.push(`${basePath}?orgId=${orgId}`)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          font-[var(--font-geist-sans)]
          cursor-pointer rounded-lg
          border border-white/[0.15]
          bg-blue-600
          px-3 py-1.5
          text-xs font-medium tracking-wide text-neutral-200
          transition
          hover:border-white/[0.3] hover:bg-white/[0.07]
          focus:outline-none
        "
      >
        CHANGE ORGANIZATION
      </button>

      {open && (
        <div className="
          absolute left-0 top-full z-50 mt-1 w-56
          rounded-lg border border-white/[0.15]
          bg-neutral-950 shadow-xl
        ">
          {/* Search input */}
          <div className="border-b border-white/[0.1] p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  handleSelect(filtered[0].org_id)
                }
              }}
              placeholder="Search organizations..."
              className="
                w-full rounded-md
                bg-white/[0.06]
                px-2 py-1.5
                text-xs text-neutral-200 placeholder-neutral-500
                focus:outline-none focus:ring-1 focus:ring-white/20
              "
            />
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((org) => (
                <li key={org.org_id}>
                  <button
                    onClick={() => handleSelect(org.org_id)}
                    className="
                      w-full px-3 py-2 text-left
                      text-xs text-neutral-200
                      hover:bg-white/[0.08]
                      transition-colors
                    "
                  >
                    {org.org_name}
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-xs text-neutral-500">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
