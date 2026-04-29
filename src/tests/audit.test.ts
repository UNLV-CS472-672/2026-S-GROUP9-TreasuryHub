import { describe, it, expect } from 'vitest'
import { getDiff} from '../app/audit/lib/util'
import { formatDisplayRole, formatAction, formatEntity} from '@/app/audit/lib/render'

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

    it('returns Unknown Role when null', () => {
        expect(formatDisplayRole(null)).toBe("Unknown Role");
    })

    it('returns the correct display role', () => {
        expect(formatDisplayRole("admin")).toBe("Admin");
    })
})

// ─────────────────────────────────────────────
// formatAction
// ─────────────────────────────────────────────
describe('formatAction', () => {
    it('formats CREATE as Created', () => {
        const result = formatAction('CREATE');

        expect(result.props.children).toBe('CREATE');
        expect(result.props.className).toContain('text-green-600')
    })

    it('formats UPDATE as Updated', () => {
        const result = formatAction('UPDATE');

        expect(result.props.children).toBe('UPDATE');
        expect(result.props.className).toContain('text-yellow-600')
    })

    it('formats DELETE as Deleted', () => {
        const result = formatAction('DELETE');

        expect(result.props.children).toBe('DELETE');
        expect(result.props.className).toContain('text-red-600')
    })

    it('returns unknown actions as-is', () => {
        const result = formatAction('INVALID');

        expect(result.props.children).toBe('UNKNOWN');
    })
})


// ─────────────────────────────────────────────
// formatEntity
// ─────────────────────────────────────────────
describe('formatEntity', () => {
    it('formats entity with capitalized name and ID slice', () => {
        expect(formatEntity('user', 'abcd1234')).toBe('User-abcd');
    });

    it('handles already capitalized entity', () => {
        expect(formatEntity('Admin', 'xyz9876')).toBe('Admin-xyz9');
    });

    it('handles short IDs', () => {
        expect(formatEntity('member', 'ab')).toBe('Member-ab');
    });

    it('handles empty ID', () => {
        expect(formatEntity('treasurer', '')).toBe('Treasurer-');
    });

    it('handles undefined-like ID safely', () => {
        // simulate bad input (TypeScript wouldn’t allow this normally)
        expect(formatEntity('user', undefined as any)).toBe('User-');
    });
});