'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import UploadModal from '../../components/UploadModal'
import FileViewer from '../../components/FileViewer'
import BackButton from '@/components/BackButton'
import OrgDropDown from '@/components/OrgDropDown'
import { canUploadFiles, canViewFiles } from '@/lib/roles'
import { getFiles, deleteFile } from '../../lib/files'

type SkeletonPulseProps = { className?: string }
function SkeletonPulse({ className = '' }: SkeletonPulseProps) {
    return (
        <div className={`animate-pulse rounded bg-white/[0.08] ${className}`} />
    )
}

function FilesPageSkeleton() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <SkeletonPulse className="h-7 w-32" />
                    <div className="flex gap-3">
                        <SkeletonPulse className="h-9 w-28 rounded" />
                        <SkeletonPulse className="h-9 w-20 rounded" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex gap-2">
                        <SkeletonPulse className="h-10 w-14 rounded border border-white/[0.12]" />
                        <SkeletonPulse className="h-10 w-20 rounded border border-white/[0.12]" />
                        <SkeletonPulse className="h-10 w-28 rounded border border-white/[0.12]" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <SkeletonPulse className="h-4 w-10" />
                        <SkeletonPulse className="h-10 w-36 rounded border border-white/[0.12]" />
                        <SkeletonPulse className="h-4 w-6" />
                        <SkeletonPulse className="h-10 w-36 rounded border border-white/[0.12]" />
                    </div>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-white/[0.08] border border-gray-200 dark:border-white/[0.12] rounded-2xl overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <li key={i} className="flex items-center justify-between p-4">
                            <div className="flex flex-col gap-2">
                                <SkeletonPulse className="h-4 w-52" />
                                <SkeletonPulse className="h-3 w-36" />
                            </div>
                            <SkeletonPulse className="h-4 w-9" />
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    )
}

type OrgOption = {
    org_id: string
    org_name: string
    role: string
}

function FilesPageContent() {
    const searchParams = useSearchParams()
    const orgIdFromParams = searchParams.get('orgId')

    const [orgId, setOrgId] = useState<string | null>(orgIdFromParams)
    const [role, setRole] = useState<string | null>(null)
    const [organizations, setOrganizations] = useState<OrgOption[]>([])
    const [files, setFiles] = useState<any[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [loading, setLoading] = useState(true)
    const [orgError, setOrgError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [viewingFile, setViewingFile] = useState<{
        filePath: string
        fileName: string
        mimeType: string
    } | null>(null)

    const [typeFilter, setTypeFilter] = useState<'all' | 'receipt' | 'document'>('all')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')

    useEffect(() => {
        async function fetchOrgsAndRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            const { data: memberships, error: membershipsError } = await supabase
                .from('org_members')
                .select('org_id, role, organizations(org_name)')
                .eq('user_id', user.id)

            if (membershipsError || !memberships || memberships.length === 0) {
                setLoading(false)
                return
            }

            const orgList: OrgOption[] = memberships.map((m: any) => ({
                org_id: m.org_id,
                org_name: m.organizations?.org_name ?? m.org_id,
                role: m.role,
            }))
            setOrganizations(orgList)

            let activeOrg = orgList[0]

            if (orgIdFromParams) {
                const match = orgList.find(o => o.org_id === orgIdFromParams)
                if (!match) {
                    setOrgError('Organization not found or you do not have access to it.')
                    setLoading(false)
                    return
                }
                activeOrg = match
            }

            setOrgId(activeOrg.org_id)
            setRole(activeOrg.role)
        }

        fetchOrgsAndRole()
    }, [orgIdFromParams])

    async function loadFiles() {
        if (!orgId) return
        try {
            setLoading(true)
            const data = await getFiles(orgId)
            setFiles(data || [])
        } catch {
            setError('Failed to load files')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (orgId && role) loadFiles()
    }, [orgId, role])

    const canAccessFiles = canViewFiles(role)
    const canUpload = canUploadFiles(role)
    const canDelete = canUploadFiles(role)

    const filteredFiles = files.filter((file) => {
        if (typeFilter !== 'all' && file.file_type !== typeFilter) return false
        const uploadedAt = new Date(file.uploaded_at)
        if (dateFrom) {
            const [year, month, day] = dateFrom.split('-').map(Number)
            if (uploadedAt < new Date(year, month - 1, day, 0, 0, 0)) return false
        }
        if (dateTo) {
            const [year, month, day] = dateTo.split('-').map(Number)
            if (uploadedAt > new Date(year, month - 1, day, 23, 59, 59)) return false
        }
        return true
    })

    if (loading) return <FilesPageSkeleton />

    if (orgError) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">Files</h1>
                    <p className="text-sm text-red-500 dark:text-red-400">{orgError}</p>
                </div>
            </main>
        )
    }

    if (!orgId) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <p className="text-sm text-gray-500 dark:text-neutral-400">You are not a member of any organization.</p>
                </div>
            </main>
        )
    }

    if (!canAccessFiles) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Files</h1>
                        <BackButton />
                    </div>
                    {organizations.length > 1 && (
                        <div className="mb-6">
                            <OrgDropDown organizations={organizations} currentOrgId={orgId} basePath="/files" />
                        </div>
                    )}
                    <p className="text-sm text-red-500 dark:text-red-400">
                        You do not have permission to access files in this organization.
                        Only treasurers, treasury team members, admins, executives, and advisors can access files.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Files</h1>
                    <div className="flex gap-3">
                        {canUpload && (
                            <button
                                onClick={() => setShowUpload(true)}
                                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
                            >
                                Upload File
                            </button>
                        )}
                        <BackButton />
                    </div>
                </div>

                {organizations.length > 1 && (
                    <div className="mb-6">
                        <OrgDropDown organizations={organizations} currentOrgId={orgId ?? ''} basePath="/files" />
                    </div>
                )}

                {showUpload && orgId && (
                    <UploadModal orgId={orgId} onSuccess={loadFiles} onClose={() => setShowUpload(false)} />
                )}

                {viewingFile && (
                    <FileViewer
                        filePath={viewingFile.filePath}
                        fileName={viewingFile.fileName}
                        mimeType={viewingFile.mimeType}
                        onClose={() => setViewingFile(null)}
                    />
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex gap-2">
                        {(['all', 'receipt', 'document'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition ${
                                    typeFilter === type
                                        ? 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-200 dark:border-white/[0.12] text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-500 dark:text-neutral-400">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-500 dark:text-neutral-400">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => { setDateFrom(''); setDateTo('') }}
                                className="text-sm text-red-500 dark:text-red-400 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}

                {!error && filteredFiles.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.12] px-4 py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
                        No files found.
                    </div>
                )}

                {!error && filteredFiles.length > 0 && (
                    <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                        <ul className="divide-y divide-gray-100 dark:divide-white/[0.08]">
                            {filteredFiles.map((file) => (
                                <li key={file.file_id} className="flex items-center justify-between px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.file_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-neutral-400 capitalize mt-0.5">
                                            {file.file_type} · {new Date(file.uploaded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setViewingFile({
                                                filePath: file.file_path,
                                                fileName: file.file_name,
                                                mimeType: file.mime_type,
                                            })}
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                                        >
                                            View
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={async () => {
                                                    if (!confirm(`Delete "${file.file_name}"?`)) return
                                                    try {
                                                        await deleteFile(file.file_id, file.file_path)
                                                        await loadFiles()
                                                    } catch {
                                                        setError('Failed to delete file')
                                                    }
                                                }}
                                                className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </main>
    )
}

export default function FilesPage() {
    return (
        <Suspense fallback={<FilesPageSkeleton />}>
            <FilesPageContent />
        </Suspense>
    )
}
