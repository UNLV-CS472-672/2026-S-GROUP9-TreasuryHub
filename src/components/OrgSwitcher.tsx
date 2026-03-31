'use client'

import Link from 'next/link'

type Props = {
    organizations: {
        org_id: string
        org_name: string
        role: string
    }[]
    currentOrgId: string
    basePath: string // e.g. '/dashboard' or '/files'
}

export default function OrgSwitcher({ organizations, currentOrgId, basePath }: Props) {
    return (
        <div className="flex flex-wrap gap-2">
            {organizations.map((org) => {
                const isActive = org.org_id === currentOrgId
                return (
                    <Link
                        key={org.org_id}
                        href={`${basePath}?orgId=${org.org_id}`}
                        className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] transition ${isActive
                            ? 'border-white/[0.35] bg-white/[0.12] text-white'
                            : 'border-white/[0.2] bg-white/[0.05] text-neutral-300 hover:border-white/[0.35] hover:bg-white/[0.08] hover:text-white'
                            }`}
                    >
                        {org.org_name}
                    </Link>
                )
            })}
        </div>
    )
}