'use client'

import { useState, useEffect } from 'react'
import { uploadFile, getTransactions } from '../lib/files'

// Set the properties the component will use
type Props = {
    orgId: string
    transactionId?: string
    onSuccess: () => void
    onClose: () => void
}

// Component UploadModal
export default function UploadModal({ orgId, transactionId, onSuccess, onClose }: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [fileType, setFileType] = useState<'receipt' | 'document'>('receipt')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [transactions, setTransactions] = useState<{ transaction_id: string }[]>([])
    const [selectedTransaction, setSelectedTransaction] = useState<string>('')

    // Load transactions when the modal opens so the user can optionally link a file
    // NOTE: dropdown labels will improve when transactions table has display fields
    useEffect(() => {
        async function loadTransactions() {
            try {
                const data = await getTransactions(orgId)
                setTransactions(data || [])
            } catch (err) {
                // Silently fail, transaction linking is optional
            }
        }
        loadTransactions()
    }, [orgId])

    async function handleUpload() {
        if (!file) return

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be under 10MB')
            return
        }

        // For receipts, accepted filetypes are pdf, jpeg, png
        const allowedReceipt = ['application/pdf', 'image/jpeg', 'image/png']

        // For documents, accepted filetypes are pdf, jpeg, png, docx, doc, xlsx
        const allowedDocument = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]

        const allowed = fileType === 'receipt' ? allowedReceipt : allowedDocument
        if (!allowed.includes(file.type)) {
            setError(
                fileType === 'receipt'
                    ? 'Receipts must be PDF, JPG, or PNG'
                    : 'Documents must be PDF, JPG, PNG, DOCX, DOC, or XLSX'
            )
            return
        }

        setUploading(true)
        setError(null)

        try {
            await uploadFile(file, orgId, fileType, selectedTransaction || undefined)
            onSuccess()
            onClose()
        } catch (err) {
            setError('Upload failed, please try again')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4 text-black">Upload File</h2>

                {/* Toggle between receipt and document */}
                <div className="flex gap-4 mb-4">
                    <button
                        onClick={() => setFileType('receipt')}
                        className={`flex-1 py-2 rounded border ${fileType === 'receipt' ? 'bg-blue-600 text-white' : 'border-gray-300 text-black'}`}
                    >
                        Receipt
                    </button>
                    <button
                        onClick={() => setFileType('document')}
                        className={`flex-1 py-2 rounded border ${fileType === 'document' ? 'bg-blue-600 text-white' : 'border-gray-300 text-black'}`}
                    >
                        Document
                    </button>
                </div>

                {/* Optional transaction linking for both receipts and documents */}
                {/* NOTE: transaction labels will improve when transaction table has display fields */}
                <div className="mb-4">
                    <label className="block text-sm text-black mb-1">
                        Link to Transaction (optional)
                    </label>
                    <select
                        value={selectedTransaction}
                        onChange={(e) => setSelectedTransaction(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-black"
                    >
                        <option value="">No transaction</option>
                        {transactions.map((t) => (
                            <option key={t.transaction_id} value={t.transaction_id}>
                                {t.transaction_id}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Hidden file input triggered by the label below */}
                <input
                    id="file-input"
                    type="file"
                    accept={fileType === 'receipt'
                        ? '.pdf,.jpg,.jpeg,.png'
                        : '.pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx'}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                />

                {/* Clicking this label opens the file picker */}
                <label
                    htmlFor="file-input"
                    className="block w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer hover:border-blue-400 text-black"
                >
                    {file ? file.name : 'Click to choose a file'}
                </label>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded border border-gray-300 text-black"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    )
}