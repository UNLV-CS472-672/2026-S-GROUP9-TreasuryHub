'use client'

import { useRouter } from 'next/navigation'

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
    const router = useRouter();
    return (
        <div>
            <label htmlFor="org-select" className="sr-only">Select Organization</label>
            <select
                value={currentOrgId}
                onChange={(e) => router.push(`${basePath}?orgId=${e.target.value}`)}
                className="rounded border px-3 py-1 text-sm transition focus:ring focus:ring-blue-300 bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                id="org-select"
            >
                {organizations.map((org) => (
                    <option key={org.org_id} value={org.org_id} className="bg-gray-200 text-black">
                        {org.org_name}
                    </option>
                ))}
            </select>
        </div>
    )
}
