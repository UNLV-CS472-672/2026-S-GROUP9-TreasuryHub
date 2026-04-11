import { describe, it, expect, vi, test, beforeEach } from 'vitest'
import { canManageOrganizationMembers, isOrganizationMemberRole, normalizeMemberEmail, getCurrentUserWithOrganizationMembership } from '../lib/organizations'

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

// --------------------------------------------------
//  getCurrentUserWithOrganizationMembership Function
// --------------------------------------------------

  //Test Suite Setup:
    
    //Mock supabase client
        //This needs to be hoisted to prevent errors.
    const { createClientMock } = vi.hoisted(() => ({
        createClientMock: vi.fn(),
    }))

    //Place createClientMock in place of createClient
    vi.mock('@/lib/supabase/server', () => ({
        createClient : createClientMock,
    }))

    //getUser will need to be built out for some tests
    const getUserMock = vi.fn()

    //from will need to be built out for some tests
    const fromMock = vi.fn()
    //Then a chain comes from "from":
    const selectMock = vi.fn()
    const eqMock = vi.fn()
    const maybeSingleMock = vi.fn()

    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock
    }

//Describe groups related tests together into a suite
describe('getCurrentUserWithOrganizationMembership', () => {
    //Reset mock states before engaging in each test
    beforeEach(() => {
        vi.resetAllMocks()

        //Need to put this in here so that resetAllMocks doesn't break the chain
        //We keep returning the object to replicate a chain of object returns
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
    })

    //1. Does authentication failing throw an error?
    test('Authentication Fails', async () => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: null },
            error: { message: 'Authentication failed' },
        }

        //mockResolvedValue is for async function where we are awaiting
        getUserMock.mockResolvedValue(userMockReturn)

        //Build out return value of createClientMock
            //In this function, the supabase object has:
                //supabase.auth
                    //Need to get a user that throws
        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            },
        }

        //Place return value into createClientMock
        createClientMock.mockResolvedValue(createClientReturn)

        //Now feed function arguments and expect it to reject and to throw an error message that was provided in this test.
        await expect(getCurrentUserWithOrganizationMembership('testOrg'))
                .rejects
                .toThrow('Authentication failed')
    })

    //2. If user is null but not error, are we returning?
    test('Null User Returns', async() => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: null },
            error: null,
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Build out return value of createClientMock
        const createClientReturn = {
            auth: {
                getUser : getUserMock,
            },
        }
        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getCurrentUserWithOrganizationMembership('testOrg'))
                .resolves
                .toEqual({
                    user: null,
                    membership: null,
                })
    })
    
    //3. If member organization check fails, are we throwing an error?
    test('Membership Check Fails', async() => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: { id: 'testUser'}},
            error: null,
        }
        getUserMock.mockResolvedValue(userMockReturn)

        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: null,
            error: { message : 'Error!'}
        })

        //Build out return value of createClientMock
        const createClientReturn = {
            auth:{
                getUser: getUserMock,
            },
            from: fromMock,
        }
        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getCurrentUserWithOrganizationMembership('testOrg'))
                .rejects
                .toThrow('Error!')
    })
    //4. If nothing stops, are we properly returning user and membership?
    test('Function returns and exits properly', async() => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: { id: 'testUser' }},
            error: null,
        }
        getUserMock.mockResolvedValue(userMockReturn)

        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: {
                user_id: 'testUser',
                org_id: 'testOrg',
                role: 'testRole',
            },
            error: null,
        })

        //Build out return value of createClientMock
        const createClientReturn = {
            auth:{
                getUser: getUserMock,
            },
            from: fromMock,
        }
        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getCurrentUserWithOrganizationMembership('testOrg'))
                .resolves
                .toEqual({
                    user: { id: 'testUser' },
                    membership: {
                        user_id: 'testUser',
                        org_id: 'testOrg',
                        role: 'testRole',
                    }
                })
    })
})

// --------------------------------------------------
//  getOrganizationById(orgId: string) Function
// --------------------------------------------------

// --------------------------------------------------
//  getUserByEmail(email: string) Function
// --------------------------------------------------

// --------------------------------------------------
//  getOrganizationMembers(orgId: string) Function
// --------------------------------------------------
