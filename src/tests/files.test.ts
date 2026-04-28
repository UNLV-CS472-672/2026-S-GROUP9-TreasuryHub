import { describe, expect, test, vi, beforeEach, onTestFailed } from 'vitest'
import { uploadFile,
         getFiles,
         deleteFile,
         getSignedUrl,
         getTransactions
       } from '../lib/files'
import { AuditLogType } from '@/app/audit/lib/data'


beforeEach(() => {
    vi.resetAllMocks()
})

//Global Mock Set Up

//Mock Supabase client
const { createClientMock } = vi.hoisted(() => ({
    createClientMock: vi.fn()
}))

//Place createCientMock into place of createClient
vi.mock('@/lib/supabase/client', () => ({
    createClient : createClientMock
}))

//Also hoist logAuditEntry, an imported function
const { logAuditEntryMock } = vi.hoisted(() => ({
    logAuditEntryMock: vi.fn()
}))

vi.mock('@/app/audit/lib/action', () => ({
    logAuditEntry : logAuditEntryMock
}))


//Database/Storage Query Mocks:

const fromMock = vi.fn()
const uploadMock = vi.fn()
const insertMock = vi.fn()
const selectMock = vi.fn()
const singleMock = vi.fn()
const eqMock = vi.fn()
const orderMock = vi.fn()
const deleteMock = vi.fn()
const removeMock = vi.fn()
const createSignedUrlMock = vi.fn()

//auth.getUser()
const getUserMock = vi.fn()

//Global Test Placeholder Variables
const testOrgID = '12345'

// ─────────────────────────────────────────────
// uploadFile Suite
// ─────────────────────────────────────────────
describe('uploadFile', () =>{
    
    //Define "File" object (so we can call the parameter in tests)
    const testFile = new File(["test"], "testFile.pdf", { type: "application/pdf" })

    const testFileType = 'receipt'
    const testTransactionID = '6789'


    //1. Does authentication failing throw an error?
    test('User Authentication Fails', async() => {
        //Set userMock

        const userMockReturn = {
            data: { user: null },
            error: { message: 'User must be authenticated to upload files' },
        }
        
        getUserMock.mockResolvedValue(userMockReturn)

        const createClientReturn = {
            auth: {
                getUser: getUserMock,
            },
        }

        //Changes to mockReturnValue instead of mockResolvedValue because we are doing
            //supabase/client and not supabase/server
        createClientMock.mockReturnValue(createClientReturn)

        await expect(uploadFile(testFile, testOrgID, testFileType, testTransactionID))
                .rejects
                .toThrow('User must be authenticated to upload files')
    })
    //2. Does file upload failing throw an error?
    test('File Upload Fails', async() => {
        
        const userMockReturn = {
            data: {
                user: { id: 'testUser'}
            },
            error: null,
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Storage query
        uploadMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!'}
        })

        fromMock.mockReturnValue({
            upload: uploadMock
        })

        const createClientReturn = {
            auth:{
                getUser: getUserMock
            },
            storage:{
                from: fromMock
            }
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run test
        await expect(uploadFile(testFile, testOrgID, testFileType, testTransactionID))
                .rejects
                .toThrow('Error!')
    })
    //3. Does data insert failing throw an error?
    test('File Database Insert Fails', async() => {
        
        //Authentication
        const userMockReturn = {
            data: {
                user: { id: 'testUser'}
            },
            error: null
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Storage query
        uploadMock.mockResolvedValue({
            data: {
                filePath: '/test',
                file: testFile,
            },
            error: null
        })

        fromMock.mockReturnValueOnce({
            upload: uploadMock
        })

        //Database Query
        const databaseQuery = {
            insert: insertMock,
            select: selectMock,
            single: singleMock,
        }

        fromMock.mockReturnValueOnce(databaseQuery)
        insertMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        singleMock.mockResolvedValue({
            data: null,
            error: { message: "Database insert failed" }
        })

        const createClientReturn = {
            auth:{
                getUser: getUserMock
            },
            storage:{
                from: fromMock
            },
            from: fromMock,
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run test
        await expect(uploadFile(testFile, testOrgID, testFileType, testTransactionID))
                .rejects
                .toThrow('Database insert failed')
    })

    //4. If the program fails to grab the user's role, does it error?
    test('Grab User Role Fail', async() => {

        //Authentication
        const userMockReturn = {
            data: {
                user: { id: 'testUser'}
            },
            error: null
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Storage query
        uploadMock.mockResolvedValue({
            data: {
                filePath: '/test',
                file: testFile,
            },
            error: null
        })

        fromMock.mockReturnValueOnce({
            upload: uploadMock
        })

        //Database Query
        const databaseQuery = {
            insert: insertMock,
            select: selectMock,
            single: singleMock,
        }

        fromMock.mockReturnValueOnce(databaseQuery)
        insertMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValueOnce(databaseQuery)
        singleMock.mockResolvedValueOnce({
            data: {
                org_id: testOrgID,
                transaction_id: testTransactionID,
                file_path: '/test',
                file_name: testFile.name,
                file_type: testFileType,
                mime_type: testFile.type,
                uploaded_by: 'testUser'
            },
            error: null
        })

        //Database Query #2 
        const databaseQuery2 = {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
        }

        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        eqMock.mockReturnValue(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        singleMock.mockResolvedValueOnce({
            data: null,
            error: { message: "Role error!"}
        })

        const createClientReturn = {
            auth:{
                getUser: getUserMock
            },
            storage:{
                from: fromMock
            },
            from: fromMock,
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run test
        await expect(uploadFile(testFile, testOrgID, testFileType, testTransactionID))
                .rejects
                .toThrow('Role error!')
    })
    //5. Does the function return properly?
    test('Function returns and exits properly', async() => {    
        //Authentication
        const userMockReturn = {
            data: {
                user: { id: 'testUser'}
            },
            error: null
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Storage query
        uploadMock.mockResolvedValue({
            data: {
                filePath: '/test',
                file: testFile,
            },
            error: null
        })

        fromMock.mockReturnValueOnce({
            upload: uploadMock
        })

        //Database Query
        const databaseQuery = {
            insert: insertMock,
            select: selectMock,
            single: singleMock,
        }

        //Returned data adds "file_id", so I need to make a call that has this included:
        const appendedReturnData = {
                file_id: "1234",
                org_id: testOrgID,
                transaction_id: testTransactionID,
                file_path: '/test',
                file_name: testFile.name,
                file_type: testFileType,
                mime_type: testFile.type,
                uploaded_by: 'testUser'
        }


        fromMock.mockReturnValueOnce(databaseQuery)
        insertMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValueOnce(databaseQuery)
        singleMock.mockResolvedValueOnce({
            data: appendedReturnData,
            error: null
        })

        //Database Query #2 
        const databaseQuery2 = {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
        }

        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        eqMock.mockReturnValue(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        singleMock.mockResolvedValueOnce({
            data: {
                role: "testAdmin"
            },
            error: null
        })

        const createClientReturn = {
            auth:{
                getUser: getUserMock
            },
            storage:{
                from: fromMock
            },
            from: fromMock,
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run test
        await expect(uploadFile(testFile, testOrgID, testFileType, testTransactionID))
                .resolves
                .toEqual(appendedReturnData)
        
        //Expect a function call
        expect(logAuditEntryMock).toHaveBeenCalledWith({
            orgId: testOrgID,
            userId: "testUser",
            action: "CREATE",
            entity_type: "file",
            entity_id: appendedReturnData.file_id,
            before_data: null,
            after_data: {
                "File Name": testFile.name,
                "File Type": testFileType,
                "MIME Type": testFile.type,
                "Transaction ID": `#${testTransactionID.slice(0,4)}`,
            },
            type: AuditLogType.FILE,
            display_role: "testAdmin"
        })
    })
    //6. TransactionID Ternary -- If null, set transaction id to none 
    test('transactionID Ternary Null Case', async() => {
        //Set transactionID to null
        const testTransactionIDnull = null
        
        //Authentication
        const userMockReturn = {
            data: {
                user: { id: 'testUser'}
            },
            error: null
        }

        getUserMock.mockResolvedValue(userMockReturn)

        //Storage query
        uploadMock.mockResolvedValue({
            data: {
                filePath: '/test',
                file: testFile,
            },
            error: null
        })

        fromMock.mockReturnValueOnce({
            upload: uploadMock
        })

        //Database Query
        const databaseQuery = {
            insert: insertMock,
            select: selectMock,
            single: singleMock,
        }

        //Returned data adds "file_id", so I need to make a call that has this included:
        const appendedReturnData = {
                file_id: "1234",
                org_id: testOrgID,
                transaction_id: testTransactionIDnull,
                file_path: '/test',
                file_name: testFile.name,
                file_type: testFileType,
                mime_type: testFile.type,
                uploaded_by: 'testUser'
        }


        fromMock.mockReturnValueOnce(databaseQuery)
        insertMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValueOnce(databaseQuery)
        singleMock.mockResolvedValueOnce({
            data: appendedReturnData,
            error: null
        })

        //Database Query #2 
        const databaseQuery2 = {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
        }

        fromMock.mockReturnValueOnce(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        eqMock.mockReturnValue(databaseQuery2)
        selectMock.mockReturnValueOnce(databaseQuery2)
        singleMock.mockResolvedValueOnce({
            data: {
                role: "testAdmin"
            },
            error: null
        })

        const createClientReturn = {
            auth:{
                getUser: getUserMock
            },
            storage:{
                from: fromMock
            },
            from: fromMock,
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run test
        await expect(uploadFile(testFile, testOrgID, testFileType, ""))
                .resolves
                .toEqual(appendedReturnData)
        
        //Expect a function call
        expect(logAuditEntryMock).toHaveBeenCalledWith({
            orgId: testOrgID,
            userId: "testUser",
            action: "CREATE",
            entity_type: "file",
            entity_id: appendedReturnData.file_id,
            before_data: null,
            after_data: {
                "File Name": testFile.name,
                "File Type": testFileType,
                "MIME Type": testFile.type,
                "Transaction ID": 'None',
            },
            type: AuditLogType.FILE,
            display_role: "testAdmin"
        })
    })

})

// ─────────────────────────────────────────────
// getFiles Suite
// ─────────────────────────────────────────────
describe('getFiles', () => {

    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        order: orderMock,
    }

    //1. If database query fails, is an error thrown?
    test('Database Query #1 Fails', async() => {
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)

        orderMock.mockResolvedValue({
            data: null,
            error: { message: 'Database query failed!'}
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run error test
        await expect(getFiles(testOrgID))
                .rejects
                .toThrow('Database query failed!')
    })

    //2. If database query succeeds, is the data properly returned?
    test('Function returns data properly', async() => {
        const returnPulledFiles = 
            [{
                file_id: 'file_1',
                org_id: testOrgID,
                transaction_id: '01',
                file_path: 'filePath1',
                file_name: 'fileName1',
                file_type: 'fileType1',
                uploaded_by: 'uploadBy1',
                uploaded_at: 'uploadAt1',
                mime_type: 'application/pdf',
            },
            {
                file_id: 'file_2',
                org_id: testOrgID,
                transaction_id: '02',
                file_path: 'filePath2',
                file_name: 'fileName2',
                file_type: 'fileType2',
                uploaded_by: 'uploadBy2',
                uploaded_at: 'uploadAt2',
                mime_type: 'application/pdf',                
            }
            ]            
        
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)

        orderMock.mockResolvedValue({
            data: returnPulledFiles,
            error: null
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Test
        await expect(getFiles(testOrgID))
                .resolves
                .toEqual(returnPulledFiles)
    })

})
// ─────────────────────────────────────────────
// deleteFile Suite
// ─────────────────────────────────────────────
describe('deleteFile', () => {
    
    const databaseQuery = {
        delete: deleteMock,
        eq: eqMock,
    }

    //1. If deleting from storage fails, is there an error?
    test('Storage Delete Throws Error', async() => {

        //Storage Query
        removeMock.mockResolvedValue({
            data: null,
            error: { message: 'Error!'}
        })

        fromMock.mockReturnValueOnce({
            remove: removeMock
        })

        const createClientReturn = {
            storage:{
                from: fromMock
            }
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(deleteFile('testFileID', 'testFilePath'))
                .rejects
                .toThrow('Error!')
    })
    //2. If deleting row from files table fails, is there an error?
    test('Row Delete Throws Error', async() => {

        //Storage Query
        removeMock.mockResolvedValue({
            data: {
                filePath: 'testFilePath'
            },
            error: null,
        })

        fromMock.mockReturnValueOnce({
            remove: removeMock
        })

        fromMock.mockReturnValueOnce(databaseQuery)
        deleteMock.mockReturnValue(databaseQuery)
        eqMock.mockResolvedValue({
            error: { message: 'Row Delete Failed!'}
        })

        const createClientReturn = {
            storage:{
                from: fromMock
            },
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(deleteFile('testFileID', 'testFilePath'))
                .rejects
                .toThrow('Row Delete Failed!')
    })
    //3. The function should return undefined, as there is no specified return value
    test('Function returns undefined', async() => {
        //Storage Query
        removeMock.mockResolvedValue({
            data: {
                filePath: 'testFilePath'
            },
            error: null,
        })

        fromMock.mockReturnValueOnce({
            remove: removeMock
        })

        fromMock.mockReturnValueOnce(databaseQuery)
        deleteMock.mockReturnValue(databaseQuery)
        eqMock.mockResolvedValue({
            error: null
        })

        const createClientReturn = {
            storage:{
                from: fromMock
            },
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(deleteFile('testFileID', 'testFilePath'))
                .resolves
                .toBeUndefined()
    })
})

// ─────────────────────────────────────────────
// getSignedUrl Suite
// ─────────────────────────────────────────────
describe('getSignedUrl', () => {
    //1. Test if error is thrown
    test('Storage URL Throws Error', async() => {
        //Storage Query
        createSignedUrlMock.mockResolvedValue({
            data: null,
            error: { message: "Signed URL Error!"}
        })

        fromMock.mockReturnValue({
            createSignedUrl: createSignedUrlMock
        })

        const createClientReturn = {
            storage:{
                from: fromMock
            }
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(getSignedUrl('testFilePath'))
                .rejects
                .toThrow('Signed URL Error!')
    })
    //2. Test if return successfully
    test('Storage URL Returns Properly', async() => {
        //Storage Query
        createSignedUrlMock.mockResolvedValue({
            data: {
                signedUrl: 'testURL'
            },
            error: null,
        })

        fromMock.mockReturnValue({
            createSignedUrl: createSignedUrlMock
        })

        const createClientReturn = {
            storage:{
                from: fromMock
            }
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(getSignedUrl('testFilePath'))
                .resolves
                .toEqual('testURL'
                )
    })
})

// ─────────────────────────────────────────────
// getTransactions Suite
// ─────────────────────────────────────────────
describe('getTransactions', () => {
    const databaseQuery = {
        select: selectMock,
        eq: eqMock,
        order: orderMock,
    }
    
    //1. Test if database query throws error
    test('Database Query Throws Error', async() => {
        //Database Query
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
        orderMock.mockResolvedValue({
            data: null,
            error: { message: 'Database query failed!'}
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        //Run error test
        await expect(getTransactions(testOrgID))
                .rejects
                .toThrow('Database query failed!')

    })
    //2. Test if return successfully
    test('getTransactions returns properly', async() => {
        const appendedReturnValue = [{
            transaction_id: '142',
            org_id: testOrgID,
            date: 'testDate',
            description: 'testdDescription',
            category: 'testCategory',
            type: 'testType',
            amount: 'testAmount',
            notes: 'testNote',
            created_by: 'testUser',
        },
        {
            transaction_id: '143',
            org_id: testOrgID,
            date: 'testDate',
            description: 'testdDescription',
            category: 'testCategory',
            type: 'testType',
            amount: 'testAmount',
            notes: 'testNote',
            created_by: 'testUser',
        }
        ]
        
        
        //Database Query
        fromMock.mockReturnValue(databaseQuery)
        selectMock.mockReturnValue(databaseQuery)
        eqMock.mockReturnValue(databaseQuery)
        orderMock.mockResolvedValue({
            data: appendedReturnValue,
            error: null
        })

        const createClientReturn = {
            from: fromMock
        }

        createClientMock.mockReturnValue(createClientReturn)

        await expect(getTransactions(testOrgID))
                .resolves
                .toEqual(appendedReturnValue)
    })
})
