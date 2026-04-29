import { describe, it, expect } from 'vitest'
import { isValidFileType,
         isValidFileSize,
        } from '../lib/fileValidation'

describe('File type validation', () => {
    it('accepts PDF as a receipt', () => {
        expect(isValidFileType('application/pdf', 'receipt')).toBe(true)
    })

    it('accepts JPEG as a receipt', () => {
        expect(isValidFileType('image/jpeg', 'receipt')).toBe(true)
    })

    it('accepts PNG as a receipt', () => {
        expect(isValidFileType('image/png', 'receipt')).toBe(true)
    })

    it('rejects DOCX as a receipt', () => {
        expect(isValidFileType(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'receipt'
        )).toBe(false)
    })

    it('rejects unknown file types as a receipt', () => {
        expect(isValidFileType('application/zip', 'receipt')).toBe(false)
    })

    it('accepts DOCX as a document', () => {
        expect(isValidFileType(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'document'
        )).toBe(true)
    })

    it('accepts XLSX as a document', () => {
        expect(isValidFileType(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'document'
        )).toBe(true)
    })

    it('rejects unknown file types as a document', () => {
        expect(isValidFileType('application/zip', 'document')).toBe(false)
    })
})

describe('File size validation', () => {
    it('accepts a file under 10MB', () => {
        expect(isValidFileSize(5 * 1024 * 1024)).toBe(true)
    })

    it('accepts a file exactly at 10MB', () => {
        expect(isValidFileSize(10 * 1024 * 1024)).toBe(true)
    })

    it('rejects a file over 10MB', () => {
        expect(isValidFileSize(11 * 1024 * 1024)).toBe(false)
    })

    it('accepts a very small file', () => {
        expect(isValidFileSize(1024)).toBe(true)
    })
})