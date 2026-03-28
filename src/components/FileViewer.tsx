'use client'

import { useState, useEffect } from 'react'
import { getSignedUrl } from '../lib/files'

type Props = {
    filePath: string
    fileName: string
    mimeType?: string
    onClose: () => void
}

export default function FileViewer({ filePath, fileName, mimeType, onClose }: Props) {
    const [url, setUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // When the component mounts, immediately fetch a signed URL for the file.
    // Done in a useEffect so it runs right when the modal opens.
    useEffect(() => {
        async function loadSignedUrl() {
            try {
                const signedUrl = await getSignedUrl(filePath)
                setUrl(signedUrl)
            } catch (err) {
                // Does not expose the storage path in the error message
                setError('File could not be loaded. It may have been deleted or access was revoked.')
            } finally {
                setLoading(false)
            }
        }
        loadSignedUrl()
    }, [filePath])

    // Determine how to render the file based on its MIME type.
    // PDFs render best in an iframe, images render as an img tag.
    // Anything else (docx, xlsx) can't be rendered inline so we show a message.
    function renderFile() {
        if (!url) return null

        const isImage = mimeType?.startsWith('image/')
        const isPdf = mimeType === 'application/pdf'
        const isOffice = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        if (isOffice) {
            return (
                <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                    title={fileName}
                    className="w-full h-full"
                />
            )
        }
        if (isImage) {
            return (
                <img
                    src={url}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain"
                />
            )
        }

        if (isPdf) {
            return (
                <iframe
                    src={url}
                    title={fileName}
                    className="w-full h-full"
                />
            )
        }

        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-black">This file type cannot be previewed inline.</p>
                <a href={url} download={fileName} className="bg-blue-600 text-white px-4 py-2 rounded">
                    Download {fileName}
                </a>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">

                {/* Header with filename and close button */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-black">{fileName}</h2>
                    <button
                        onClick={onClose}
                        className="text-black hover:text-gray-600 text-xl font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* File content area */}
                <div className="flex-1 overflow-auto p-4">
                    {loading && <p className="text-black">Loading file...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && renderFile()}
                </div>

            </div>
        </div>
    )
}