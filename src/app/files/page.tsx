'use client'

import { useState, useEffect } from 'react'
import { getFiles } from '../../lib/files'
import UploadModal from '../../components/UploadModal'
import FileViewer from '../../components/FileViewer'

// Temporary hardcoded org ID for testing, will come from auth context later
const TEST_ORG_ID = '10148741-4cbb-4d58-977d-13fdd4398eb4'

export default function FilesPage() {
    const [files, setFiles] = useState<any[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // FileViewer state — tracks which file is currently being viewed
    const [viewingFile, setViewingFile] = useState<{
        filePath: string
        fileName: string
        mimeType: string
    } | null>(null)

    // Filter state
    const [typeFilter, setTypeFilter] = useState<'all' | 'receipt' | 'document'>('all')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')

    async function loadFiles() {
        try {
            setLoading(true)
            const data = await getFiles(TEST_ORG_ID)
            setFiles(data || [])
        } catch (err) {
            setError('Failed to load files')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFiles()
    }, [])

    // Apply filters to the files array before rendering.
    // All date comparisons use local time to match what the user sees on screen.
    // Manually parses the date string into year/month/day parts and pass them
    // to the Date constructor as numbers — this forces local timezone interpretation
    // rather than UTC, which is what happens when you pass a string like "2026-03-01".
    const filteredFiles = files.filter((file) => {
        if (typeFilter !== 'all' && file.file_type !== typeFilter) return false

        const uploadedAt = new Date(file.uploaded_at)

        if (dateFrom) {
            // Split "2026-03-01" into [2026, 3, 1] and create a local midnight boundary
            const [year, month, day] = dateFrom.split('-').map(Number)
            const fromDate = new Date(year, month - 1, day, 0, 0, 0)
            if (uploadedAt < fromDate) return false
        }

        if (dateTo) {
            const [year, month, day] = dateTo.split('-').map(Number)
            // Use end of day so files uploaded on the "to" date are included
            const toDate = new Date(year, month - 1, day, 23, 59, 59)
            if (uploadedAt > toDate) return false
        }

        return true
    })

    return (
        <div className="p-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-white">Files</h1>
                <button
                    onClick={() => setShowUpload(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Upload File
                </button>
            </div>

            {/* Upload modal */}
            {showUpload && (
                <UploadModal
                    orgId={TEST_ORG_ID}
                    onSuccess={loadFiles}
                    onClose={() => setShowUpload(false)}
                />
            )}

            {/* File viewer modal — only renders when a file is being viewed */}
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

                {/* Type filter tabs */}
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
                {/* NOTE: UI styling for these inputs should be revisited when
                    the team finalizes the design system */}
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
                    {/* Clear date filters button — only shows when a date is set */}
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
            {loading && <p className="text-white">Loading files...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && filteredFiles.length === 0 && (
                <p className="text-white">No files found.</p>
            )}

            {/* File list */}
            {!loading && !error && filteredFiles.length > 0 && (
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