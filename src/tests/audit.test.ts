import { describe, it, expect } from 'vitest'
import { getDiff, formatAction } from '../app/audit/lib/util'

// ─────────────────────────────────────────────
// getDiff
// ─────────────────────────────────────────────
describe('getDiff', () => {
    it('returns empty array when objects are identical', () => {
        const before = { amount: 100, description: 'test' }
        const after = { amount: 100, description: 'test' }
        expect(getDiff(before, after)).toEqual([])
    })

    it('detects a changed field', () => {
        const before = { amount: 100 }
        const after = { amount: 200 }
        const result = getDiff(before, after)
        expect(result).toHaveLength(1)
        expect(result[0].field).toBe('amount')
        expect(result[0].oldValue).toBe(100)
        expect(result[0].newValue).toBe(200)
    })

    it('detects multiple changed fields', () => {
        const before = { amount: 100, description: 'old' }
        const after = { amount: 200, description: 'new' }
        expect(getDiff(before, after)).toHaveLength(2)
    })

    it('detects a field added in after', () => {
        const before = { amount: 100 }
        const after = { amount: 100, notes: 'added' }
        const result = getDiff(before, after)
        expect(result).toHaveLength(1)
        expect(result[0].field).toBe('notes')
        expect(result[0].oldValue).toBe('-')
        expect(result[0].newValue).toBe('added')
    })

    it('detects a field removed in after', () => {
        const before = { amount: 100, notes: 'was here' }
        const after = { amount: 100 }
        const result = getDiff(before, after)
        expect(result).toHaveLength(1)
        expect(result[0].field).toBe('notes')
        expect(result[0].oldValue).toBe('was here')
        expect(result[0].newValue).toBe('-')
    })

    it('handles null before gracefully', () => {
        const after = { amount: 100 }
        const result = getDiff(null, after)
        expect(result).toHaveLength(1)
        expect(result[0].field).toBe('amount')
    })

    it('handles null after gracefully', () => {
        const before = { amount: 100 }
        const result = getDiff(before, null)
        expect(result).toHaveLength(1)
        expect(result[0].field).toBe('amount')
    })

    it('handles both null gracefully', () => {
        expect(getDiff(null, null)).toEqual([])
    })
})

// ─────────────────────────────────────────────
// formatAction
// ─────────────────────────────────────────────
describe('formatAction', () => {
    it('formats CREATE as Created', () => {
        expect(formatAction('CREATE')).toBe('Created')
    })

    it('formats UPDATE as Updated', () => {
        expect(formatAction('UPDATE')).toBe('Updated')
    })

    it('formats DELETE as Deleted', () => {
        expect(formatAction('DELETE')).toBe('Deleted')
    })

    it('returns unknown actions as-is', () => {
        expect(formatAction('UNKNOWN')).toBe('UNKNOWN')
    })
})