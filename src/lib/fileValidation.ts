export const ALLOWED_RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export function isValidFileType(mimeType: string, fileType: 'receipt' | 'document'): boolean {
    const allowed = fileType === 'receipt' ? ALLOWED_RECEIPT_TYPES : ALLOWED_DOCUMENT_TYPES
    return allowed.includes(mimeType)
}

export function isValidFileSize(sizeBytes: number): boolean {
    return sizeBytes <= MAX_FILE_SIZE_BYTES
}