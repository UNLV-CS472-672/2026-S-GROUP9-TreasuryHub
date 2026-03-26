'use client'

import { useState, useEffect } from 'react'
import { getFiles } from '../../lib/files'
import UploadModal from '../../components/UploadModal'

// Temporary hardcoded org ID for testing, will come from auth context later
const TEST_ORG_ID = '10148741-4cbb-4d58-977d-13fdd4398eb4'

export default function FilesPage() {
    const [files, setFiles] = useState<any[]>([])
    const [showUpload, setShowUpload] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Files</h1>
                <button
                    onClick={() => setShowUpload(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Upload File
                </button>
            </div>

            {showUpload && (
                <UploadModal
                    orgId={TEST_ORG_ID}
                    onSuccess={loadFiles}
                    onClose={() => setShowUpload(false)}
                />
            )}

            {loading && <p className="text-black">Loading files...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && files.length === 0 && (
                <p className="text-black">No files uploaded yet.</p>
            )}

            {!loading && !error && files.length > 0 && (
                <ul className="divide-y border rounded-lg">
                    {files.map((file) => (
                        <li key={file.file_id} className="flex items-center justify-between p-4">
                            <div>
                                <p className="font-medium">{file.file_name}</p>
                                <p className="text-sm text-black capitalize">
                                    {file.file_type} · {new Date(file.uploaded_at).toLocaleDateString()}
                                </p>
                            </div>
                            {/* View button will be wired up in PR3 */}
                            <button className="text-blue-600 text-sm">View</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}