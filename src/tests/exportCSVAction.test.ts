import { describe, expect, vi, test, beforeEach } from 'vitest'
import { getOrgMemberships, exportCSV } from '../app/export-csv/action'

import { TRANSACTION_EXPORT_ROLES, canExportTransactions } from "@/lib/roles"

//Set up

//Mock supabase client
const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn()
}))

//Place createClientMock in place of createClient

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock
}))

//Database Query needs from, select, eq, in, single, order
const fromMock = vi.fn()
const selectMock = vi.fn()
const eqMock = vi.fn()
const inMock = vi.fn()
const singleMock = vi.fn()
const orderMock = vi.fn()
const getUserMock = vi.fn()

// --------------------------------------------------
//  getOrgMembership Function
// --------------------------------------------------
describe('getOrgMembership', () => {

    //Defining Suite Globals
    
    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        in: inMock,
    }

    beforeEach(() =>{
        vi.resetAllMocks()

        //Preserve database query mock chain
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
    })

    //1. Does user authentication throw a failure?
    test('User authentication fails', async () => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: null},
            error: { message: 'Authentication failed' },
        }

        getUserMock.mockResolvedValue(userMockReturn)

        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            }
        }

        createClientMock.mockResolvedValue(createClientReturn)

        
        const result = await getOrgMemberships()
        
        //Check what was returned
        expect(result).toEqual({
            error: "Unauthorized",
            code: "unauthorized"
        })
    })
    //2. Does database query error report an error?
    test('Membership database query fails', async() => {
        //Set userMock return values
        const userMockReturn = {
            data: { user: 'testUser'},
            error: null,
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Supplying database query
        inMock.mockResolvedValue({
            data: null,
            error: { message: "Membership query error!"}
        })

        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            },
            from: fromMock
        }
        createClientMock.mockResolvedValue(createClientReturn)

        const result = await getOrgMemberships()

        //Check return
        expect(result).toEqual({
            error: "Membership query error!",
            code: "db_error"
        })
    })
    //3. If database query returns null or memberships.legnth is 0, do we throw error?
    test('Member is not a treasurer of any organization', async() =>{
        //Set userMock return values
        const userMockReturn = {
            data: { user: 'testUser'},
            error: null,
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Supplying database query
        inMock.mockResolvedValue({
            data: null,
            error: null,
        })

        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            },
            from: fromMock
        }
        createClientMock.mockResolvedValue(createClientReturn)

        const result = await getOrgMemberships()

        //Check return
        expect(result).toEqual({
            error: "You are not a treasurer of any organization.",
            code: "no_org"
        })
    })
    //4. If successful, does the function return properly?
    test("Function returns memberships object successfully", async() =>{
        
        const membershipsObject = [{
            org_id: "org-123",
            role: "treasurer",
            organizations: {
                org_name: "Test Organization"
            },
        }]
        
        //Set userMock return values
        const userMockReturn = {
            data: { user: { id: 'testUser' } },
            error: null,
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Supplying database query
        inMock.mockResolvedValue({
            data: membershipsObject,
            error: null,
        })

        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            },
            from: fromMock
        }
        createClientMock.mockResolvedValue(createClientReturn)

        const result = await getOrgMemberships()

        //Check return
        expect(result).toEqual({
            memberships: membershipsObject
        })

    })


})