import { describe, expect, vi, test, beforeEach } from 'vitest'
import{
    logAuditEntry,
    type LogEntry
} from '../app/audit/lib/action'




//Set Up

//Mock supabase client
const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn()
}))

//Place createClientMock in place of createClient

vi.mock('@/lib/supabase/server', () => ({
    createClient: createClientMock
}))

//Database Query needs from and insert
const fromMock = vi.fn()
const insertMock = vi.fn()




// --------------------------------------------------
//  logAuditEntry Function
// --------------------------------------------------
describe('logAuditEntry', () => {

    //Defining suite globals

    const testEntry: LogEntry =  {
        orgId: "1234",
        userId: "testUser",
        action: "CREATE",
        entity_type: "file",
        entity_id: "12345",
        before_data: null,
        after_data: {
        "File Name": "name",
        "File Type": "fileType",
        "MIME Type": "mimeType",
        "Transaction ID": "None",
        },
        type: "file",
        display_role: "testAdmin",
    };

    const testEntryMissingAfter: LogEntry =  {
        orgId: "1234",
        userId: "testUser",
        action: "CREATE",
        entity_type: "file",
        entity_id: "12345",
        before_data: {
        "File Name": "name",
        "File Type": "fileType",
        "MIME Type": "mimeType",
        "Transaction ID": "None",
        },
        after_data: null,
        type: "file",
        display_role: "testAdmin",
    };


    const databaseQuery = {
        insert: insertMock
    }

    beforeEach(() =>{
        vi.resetAllMocks()
        
        //Preserve database query mock chain
        fromMock.mockReturnValue(databaseQuery)
    })

    //1. Does database insert error report to console?
    test('Database Insert Fails Console Log', async () =>{
        
        insertMock.mockResolvedValue({
            data: null,
            error: { message: "Failed audit log insert"}
        })

        //Since error is reported in console, need to watch console using Vitest's spy method
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

        //Build out return value of createClientMock
        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run test
        await logAuditEntry(testEntry)
         
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Failed to log audit entry:", "Failed audit log insert"
        )
        
    })

    //2. Does database insert success report to console?
    test('Database Insert Succeeds Console Log', async() =>{

        insertMock.mockResolvedValue({
            data: testEntry,
            error: null
        })

        const consoleSuccessSpy = vi.spyOn(console, "log").mockImplementation(() => {})

        //Build out return value of createClientMock
        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run Test
        await logAuditEntry(testEntry)

        expect(consoleSuccessSpy).toHaveBeenCalledWith(
            "Audit entry logged successfully", testEntry
        )
    })
    //3. If before_date is null, does database insert still succeed?
    test('Database Insert Success Persists with Null After_Data', async() =>{
        insertMock.mockResolvedValue({
            data: testEntryMissingAfter,
            error: null
        })

        const consoleSuccessSpy = vi.spyOn(console, "log").mockImplementation(() => {})

        //Build out return value of createClientMock
        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockResolvedValue(createClientReturn)

        //Run Test
        await logAuditEntry(testEntryMissingAfter)

        expect(consoleSuccessSpy).toHaveBeenCalledWith(
            "Audit entry logged successfully", testEntryMissingAfter
        )
    })


})
