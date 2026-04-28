import { describe, it, expect, vi, test, beforeEach } from 'vitest'
import { canManageOrganizationMembers, 
         isOrganizationMemberRole,
         normalizeMemberEmail,
         getCurrentUserWithOrganizationMembership,
         getOrganizationById,
         getUserByEmail,
         getOrganizationMembers
        } from '../lib/organizations'

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

//Global Mock Set Up

//Mock supabase client
    //This needs to be hoisted to prevent errors.
const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn()
}))

//Place createClientMock in place of createClient
vi.mock('@/lib/supabase/server', () => ({
    createClient : createClientMock
}))

//getUser will need to be built out for some tests
const getUserMock = vi.fn()

//from will need to be built out for some tests
const fromMock = vi.fn()
//Then a chain comes from "from":
const selectMock = vi.fn()
const eqMock = vi.fn()
const maybeSingleMock = vi.fn()

//All possible chains will be defined here, so they do not need to be redeclared every test suite
const orderMock = vi.fn()
const inMock = vi.fn()


// --------------------------------------------------
//  getCurrentUserWithOrganizationMembership Function
// --------------------------------------------------
    
//Describe groups related tests together into a suite
describe('getCurrentUserWithOrganizationMembership', () => {

    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock
    }

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

//Test Suite:
describe('getOrganizationById', () => {
    //Test Suite Setup:
    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock
    }

    //Reset mock states before engaging each test
    beforeEach(() => {
        vi.resetAllMocks()

        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
    })

    //1. Does database query error throw an error?
    test('Database Query Fails', async() => {
        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!' }
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getOrganizationById('testOrg'))
                .rejects
                .toThrow('Error!')
    })

    //2. Is the function returning properly?
    test('Proper return', async() => {

        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: {
                org_id: '12345',
                org_name: 'testOrg',
                logo_path: 'logo.png'
            },
            error: null,
        })

        //Creating return value
        const createClientReturn = {
            from: fromMock
        }

        //Setting return value
        createClientMock.mockResolvedValue(createClientReturn)

        //Running test
        await expect(getOrganizationById('12345'))
                .resolves
                .toEqual({
                    org_id: '12345',
                    org_name: 'testOrg',
                    logo_path: 'logo.png',
                })
    }) 
})


// --------------------------------------------------
//  getUserByEmail(email: string) Function
// --------------------------------------------------

//Test Suite
describe('getUserByEmail', () => {
    //Suite Setup
    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
    }

    //Reset mock states
    beforeEach(() => {
        vi.resetAllMocks()

        //Reestablish database query chain
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
    })

    //1. On failure, does database query throw an error?
    test('Database Query Fails', async() => {
        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!' }
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getUserByEmail('test@email.com'))
                .rejects
                .toThrow('Error!')
    })

    //2. Does function return properly?
    test('Proper return', async() => {

        //Supplying database query
        maybeSingleMock.mockResolvedValue({
            data: {
                user_id: '12345',
                email: 'test@email.com',
                display_name: 'TestDisplayName'
            },
            error: null,
        })

        //Creating return value
        const createClientReturn = {
            from: fromMock
        }

        //Setting return value
        createClientMock.mockResolvedValue(createClientReturn)

        //Running test
        await expect(getUserByEmail('test@email.com'))
                .resolves
                .toEqual({
                    user_id: '12345',
                    email: 'test@email.com',
                    display_name: 'TestDisplayName',
                })
    })
})

// --------------------------------------------------
//  getOrganizationMembers(orgId: string) Function
// --------------------------------------------------

//Test Suite
describe('getOrganizationMembers', () => {
    //Suite Setup
    const databaseQuery1 = {
        select: selectMock,
        eq: eqMock,
        order: orderMock
    }
    
    const databaseQuery2 = {
        select: selectMock,
        in: inMock
    }

    beforeEach(() => {
        vi.resetAllMocks()

        //Database query will be established per test, since there are different chains that must be created.
        fromMock.mockReturnValue(databaseQuery1)
        selectMock.mockReturnValue(databaseQuery1)
        eqMock.mockReturnValue(databaseQuery1)
    })

    //1. Does the first database query throw an error?
    test('Database Query #1 Fails', async() => {
        orderMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!' }
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getOrganizationMembers('56789'))
                .rejects
                .toThrow('Error!')
    })

    //2. Does the length check return on 0?
    test('Length 0 Returns', async() => {
        orderMock.mockResolvedValue({
            //Empty array (length 0)
            data: [],
            error: null
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getOrganizationMembers('56789'))
                .resolves
                .toEqual([])      
    })

    //3. Does the second database query return an error?
    test('Database Query #2 Fails', async() => {
        
        fromMock.mockReturnValueOnce(databaseQuery1)
        selectMock.mockReturnValueOnce(databaseQuery1)
        orderMock.mockResolvedValue({
            //Returns an array
            data: [ 
                    {
                        user_id: '12345',
                        org_id: '56789',
                        role: 'admin',
                    },
                    {
                        user_id: '23456',
                        org_id: '56789',
                        role: 'treasurer', 
                    }
                ],
            error: null
        })
        
        //Forming a new mock chain
        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        inMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!' }
        })


        //Note in this test, the fromMock has two different calls for the different database queries.
        const createClientReturn = {
            from: fromMock,
        }

        //Add in return
        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getOrganizationMembers('56789'))
                .rejects
                .toThrow('Error!')
    })

    //4. Does the function return properly?
    test('Function returns organization members', async() => {
        
        fromMock.mockReturnValueOnce(databaseQuery1)
        selectMock.mockReturnValueOnce(databaseQuery1)
        orderMock.mockResolvedValue({
            //Returns an array
            data: [ 
                    {
                        user_id: '12345',
                        org_id: '56789',
                        role: 'admin',
                    },
                    {
                        user_id: '23456',
                        org_id: '56789',
                        role: 'treasurer', 
                    }
                ],
            error: null
        })
        
        //Forming a new mock chain
        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        inMock.mockResolvedValue({
            data: [
                    {
                        user_id: '12345',
                        email: 'test1@email.com',
                        display_name: 'Test1'
                    },
                    {
                        user_id: '23456',
                        email: 'test2@email.com',
                        display_name: 'Test2'
                    }
            ],
            error: null
        })

        //Map database queries to client return
        const createClientReturn = {
            from: fromMock,
        }

        //Set return
        createClientMock.mockResolvedValue(createClientReturn)

        //Run Test
        await expect(getOrganizationMembers('56789'))
            .resolves
            //TO equal all the information retrieved
                //user_id, org_id, role, and then all of user's information
            .toEqual([
                {
                    user_id: '12345',
                    org_id: '56789',
                    role: 'admin',
                    user: {
                        user_id: '12345',
                        email: 'test1@email.com',
                        display_name: 'Test1'
                    }
                },
                {
                    user_id: '23456',
                    org_id: '56789',
                    role: 'treasurer', 
                    user: {
                        user_id: '23456',
                        email: 'test2@email.com',
                        display_name: 'Test2'
                    }
                }
            ])
    })

    //5. If the first database query is null, do we handle the branch appropriately?
    test('Database Query #1 Returns Null', async() =>{
        orderMock.mockResolvedValue({
            data: null, //If null, the code should convert this to [] 
            error: null
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await expect(getOrganizationMembers('56789'))
                .resolves
                .toEqual([])      
    })
    //6. If the second database query is null, do we handle the branch appropriately?
    test('Database Query #2 Returns Null', async() =>{
                fromMock.mockReturnValueOnce(databaseQuery1)
        selectMock.mockReturnValueOnce(databaseQuery1)
        orderMock.mockResolvedValue({
            //Returns an array
            data: [ 
                    {
                        user_id: '12345',
                        org_id: '56789',
                        role: 'admin',
                    },
                    {
                        user_id: '23456',
                        org_id: '56789',
                        role: 'treasurer', 
                    }
                ],
            error: null
        })
        
        //Forming a new mock chain
        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        inMock.mockResolvedValue({
            data: null,
            error: null
        })

        //Map database queries to client return
        const createClientReturn = {
            from: fromMock,
        }

        //Set return
        createClientMock.mockResolvedValue(createClientReturn)

        //Run Test
        await expect(getOrganizationMembers('56789'))
            .resolves
            //TO equal all the information retrieved
                //user_id, org_id, role, and then all of user's information
            .toEqual([
                {
                    user_id: '12345',
                    org_id: '56789',
                    role: 'admin',
                    user: null,
                },
                {
                    user_id: '23456',
                    org_id: '56789',
                    role: 'treasurer', 
                    user: null
                }
            ])
    })
})