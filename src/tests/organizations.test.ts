import { describe, it, expect } from 'vitest'
import { canManageOrganizationMembers, isOrganizationMemberRole, normalizeMemberEmail } from '../lib/organizations'

// ─────────────────────────────────────────────
// canManageOrganizationMembers
// ─────────────────────────────────────────────
describe('canManageOrganizationMembers', () => {
    it('returns true for treasurer', () => {
        expect(canManageOrganizationMembers('treasurer')).toBe(true)
    })

    it('returns true for admin', () => {
        expect(canManageOrganizationMembers('admin')).toBe(true)
    })

    it('returns false for member', () => {
        expect(canManageOrganizationMembers('member')).toBe(false)
    })

    it('returns false for executive', () => {
        expect(canManageOrganizationMembers('executive')).toBe(false)
    })

    it('returns false for advisor', () => {
        expect(canManageOrganizationMembers('advisor')).toBe(false)
    })

    it('returns false for treasury_team', () => {
        expect(canManageOrganizationMembers('treasury_team')).toBe(false)
    })

    it('returns false for null', () => {
        expect(canManageOrganizationMembers(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(canManageOrganizationMembers(undefined)).toBe(false)
    })
})

// ─────────────────────────────────────────────
// isOrganizationMemberRole
// ─────────────────────────────────────────────
describe('isOrganizationMemberRole', () => {
    it('returns true for member', () => {
        expect(isOrganizationMemberRole('member')).toBe(true)
    })

    it('returns true for executive', () => {
        expect(isOrganizationMemberRole('executive')).toBe(true)
    })

    it('returns true for advisor', () => {
        expect(isOrganizationMemberRole('advisor')).toBe(true)
    })

    it('returns true for treasury_team', () => {
        expect(isOrganizationMemberRole('treasury_team')).toBe(true)
    })

    it('returns true for treasurer', () => {
        expect(isOrganizationMemberRole('treasurer')).toBe(true)
    })

    it('returns true for admin', () => {
        expect(isOrganizationMemberRole('admin')).toBe(true)
    })

    it('returns false for an invalid role', () => {
        expect(isOrganizationMemberRole('superuser')).toBe(false)
    })

    it('returns false for null', () => {
        expect(isOrganizationMemberRole(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(isOrganizationMemberRole(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
        expect(isOrganizationMemberRole('')).toBe(false)
    })
})

// ─────────────────────────────────────────────
// normalizeMemberEmail
// ─────────────────────────────────────────────
describe('normalizeMemberEmail', () => {
    it('lowercases an uppercase email', () => {
        expect(normalizeMemberEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
    })

    it('trims leading and trailing whitespace', () => {
        expect(normalizeMemberEmail('  test@example.com  ')).toBe('test@example.com')
    })

    it('handles mixed case and whitespace together', () => {
        expect(normalizeMemberEmail('  TEST@Example.Com  ')).toBe('test@example.com')
    })

    it('leaves a clean email unchanged', () => {
        expect(normalizeMemberEmail('test@example.com')).toBe('test@example.com')
    })
})