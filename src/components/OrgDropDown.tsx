'use client'

import { useRouter } from 'next/navigation'
import { type OrgOptions } from '@/app/transaction/lib/schemas';

type Props = {
    organizations: OrgOptions[]
    currentOrgId: string
    basePath: string // e.g. '/dashboard' or '/files'
}

export default function OrgDropDown({ organizations, currentOrgId, basePath }: Props) {
    const router = useRouter();
    return (
        <div>
      <label htmlFor="org-select" className="sr-only">
        Change Organization
      </label>

      <select
        id="org-select"
        defaultValue=""
        onChange={(e) => {
          const selectedOrgId = e.target.value
          if (!selectedOrgId) return

          e.target.value = "" // reset to "Change Org"
          router.push(`${basePath}?orgId=${selectedOrgId}`)
        }}
        className="
          font-[var(--font-geist-sans)]
          cursor-pointer
          rounded-lg
          border border-white/[0.15]
          bg-white/[0.04]
          px-3 py-1.5
          pr-3
          text-xs font-medium tracking-wide text-neutral-200
          transition
          hover:border-white/[0.3]
          hover:bg-white/[0.07]
          focus:outline-none
        "
      >
        {/* Placeholder */}
        <option value="" disabled className="bg-black text-neutral-400">
          CHANGE ORGANIZATION
        </option>
        {/* Other orgs */}
        {organizations
          .filter((org) => org.org_id !== currentOrgId)
          .map((org) => (
            <option
              key={org.org_id}
              value={org.org_id}
              className="bg-black text-white"
            >
              {org.org_name}
            </option>
          ))}
      </select>
    </div>
    )
}
