'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { getFiles } from '../../lib/files'
import UploadModal from '../../components/UploadModal'
import FileViewer from '../../components/FileViewer'
import BackButton from '@/components/BackButton'
//import OrgSwitcher from '../../components/OrgSwitcher'
import OrgDropDown from '@/components/OrgDropDown'
import { canUploadFiles, canViewFiles } from '@/lib/roles'


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

    // Fetch all orgs the user belongs to, and determine the active org + role
    useEffect(() => {
        async function fetchOrgsAndRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Get all org memberships with org names
            const { data: memberships, error: membershipsError } = await supabase
                .from('org_members')
                .select('org_id, role, organizations(org_name)')
                .eq('user_id', user.id)

            if (membershipsError || !memberships || memberships.length === 0) {
                setLoading(false)
                return
            }

            // Build the org list for the switcher
            const orgList: OrgOption[] = memberships.map((m: any) => ({
                org_id: m.org_id,
                org_name: m.organizations?.org_name ?? m.org_id,
                role: m.role,
            }))
            setOrganizations(orgList)

            // Find the active org — either from URL params or default to first
            let activeOrg = orgList[0]

            if (orgIdFromParams) {
                const match = orgList.find(o => o.org_id === orgIdFromParams)
                if (!match) {
                    // User passed an orgId they don't belong to
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
        } catch (err) {
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

    const filteredFiles = files.filter((file) => {
        if (typeFilter !== 'all' && file.file_type !== typeFilter) return false

        const uploadedAt = new Date(file.uploaded_at)

        if (dateFrom) {
            const [year, month, day] = dateFrom.split('-').map(Number)
            const fromDate = new Date(year, month - 1, day, 0, 0, 0)
            if (uploadedAt < fromDate) return false
        }

        if (dateTo) {
            const [year, month, day] = dateTo.split('-').map(Number)
            const toDate = new Date(year, month - 1, day, 23, 59, 59)
            if (uploadedAt > toDate) return false
        }

        return true
    })

    // Loading state
    if (loading) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <p className="text-white">Loading...</p>
            </div>
        )
    }

    // Invalid org in URL
    if (orgError) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold text-white mb-4">Files</h1>
                <p className="text-red-400">{orgError}</p>
            </div>
        )
    }

    // No org membership
    if (!orgId) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <p className="text-white">You are not a member of any organization.</p>
            </div>
        )
    }

    // No permission
    if (!canAccessFiles) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold text-white mb-4">Files</h1>
                {organizations.length > 1 && (
                    <div className="mb-6">
                        {/*<OrgSwitcher
                            organizations={organizations}
                            currentOrgId={orgId}
                            basePath="/files"
                        />*/}
                        <OrgDropDown
                            organizations={organizations}
                            currentOrgId={orgId}
                            basePath="/files"
                        />

                    </div>
                )}
                <p className="text-red-400">
                    You do not have permission to access files in this organization.
                    Only treasurers, treasury team members, admins, executives, and advisors can access files.
                </p>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-semibold text-white">Files</h1>

                <div className="flex gap-4">
                    {canUpload && (
                        <button
                            onClick={() => setShowUpload(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            Upload File
                        </button>
                    )}
                    <BackButton />
                </div>
            </div>

            {/* Org switcher — only shows if user belongs to multiple orgs */}
            {organizations.length > 1 && (
                <div className="mb-6">
                    {/*<OrgSwitcher
                        organizations={organizations}
                        currentOrgId={orgId}
                        basePath="/files"
                    />*/}
                    <OrgDropDown
                        organizations={organizations}
                        currentOrgId={orgId}
                        basePath="/files"
                    />
                </div>
            )}

            {/* Upload modal */}
            {showUpload && orgId && (
                <UploadModal
                    orgId={orgId}
                    onSuccess={loadFiles}
                    onClose={() => setShowUpload(false)}
                />
            )}

            {/* File viewer modal */}
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
                            className={`px-4 py-2 rounded border capitalize ${typeFilter === type
                                ? 'bg-blue-600 text-white'
                                : 'border-gray-300 text-white'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Date range filter */}
                {/* NOTE: UI styling should be revisited when the team finalizes the design system */}
                <div className="flex gap-2 items-center">
                    <label className="text-sm text-white">From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="border border-gray-300 rounded p-2 text-white text-sm"
                    />
                    <label className="text-sm text-white">To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="border border-gray-300 rounded p-2 text-white text-sm"
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(''); setDateTo('') }}
                            className="text-sm text-red-500"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Page states */}
            {error && <p className="text-red-500">{error}</p>}
            {!error && filteredFiles.length === 0 && (
                <p className="text-white">No files found.</p>
            )}

            {/* File list */}
            {!error && filteredFiles.length > 0 && (
                <ul className="divide-y border rounded-lg">
                    {filteredFiles.map((file) => (
                        <li key={file.file_id} className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium text-white">{file.file_name}</p>
                                <p className="text-sm text-white capitalize">
                                    {file.file_type} · {new Date(file.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingFile({
                                    filePath: file.file_path,
                                    fileName: file.file_name,
                                    mimeType: file.mime_type,
                                })}
                                className="text-blue-600 text-sm"
                            >
                                View
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default function FilesPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 max-w-4xl mx-auto">
                    <p className="text-white">Loading...</p>
                </div>
            }
        >
            <FilesPageContent />
        </Suspense>
    )
}