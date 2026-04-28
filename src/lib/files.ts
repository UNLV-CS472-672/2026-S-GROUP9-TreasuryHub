import { createClient } from './supabase/client'
import { logAuditEntry } from '@/app/audit/lib/action'
import { AuditLogType } from '@/app/audit/lib/data'

// Uploads a file to the supabase storage, and to the files table
export async function uploadFile(file: File, orgId: string, fileType: 'receipt' | 'document', transactionId?: string) {
    const supabase = createClient()

    // Get the current user so we can save uploaded_by
    const { data: { user } } = await supabase.auth.getUser()

    // This helps resolve the "user could be null" problem
    if (!user) {
        throw new Error("User must be authenticated to upload files")
    }

    // Building a unique storage path for the file
    const filePath = `${orgId}/${Date.now()}_${file.name}`

    // Upload the actual file to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file)

    if (uploadError) throw uploadError

    // Insert the data to the files table
    const { data, error: dbError } = await supabase
        .from('files')
        .insert({
            org_id: orgId,
            transaction_id: transactionId || null,
            file_path: filePath,
            file_name: file.name,
            file_type: fileType,
            mime_type: file.type,
            //Edited 4/27/2026 -- It is impossible for user to be null at this point, as the check is already performed above.
            uploaded_by: user.id,
        })
        .select()
        .single()

    if (dbError) throw dbError

    // Grab the user's role
    const { data: roleData, error: roleError } = await supabase
        .from("org_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .select()
        .single()

    if (roleError) throw roleError


    // Insert the data into the audit logs
    await logAuditEntry ({
        orgId: orgId,
        userId: user.id,
        action: "CREATE",
        entity_type: "file",
        entity_id: data.file_id,
        before_data: null,
        after_data: {
            "File Name" : data.file_name,
            "File Type": data.file_type,
            "MIME Type" : data.mime_type,
            "Transaction ID": data.transaction_id
        ? `#${data.transaction_id.slice(0, 4)}`
        : "None",
        },
        type: AuditLogType.FILE,
        display_role: roleData.role,
    })

    return data
}

// Gets all of the file rows for a given orgId 
export async function getFiles(orgId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('org_id', orgId)
        .order('uploaded_at', { ascending: false })

    if (error) throw error

    return data
}

// Deletes a file with a given fileId and filePath from storage and from the files table
export async function deleteFile(fileId: string, filePath: string) {
    const supabase = createClient()
    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath])

    if (storageError) throw storageError

    // Delete the row in the files table
    const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('file_id', fileId)

    if (dbError) throw dbError
}

// Creates a url to the file that expires in 60 seconds
export async function getSignedUrl(filePath: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 60)

    if (error) throw error

    return data.signedUrl
}

// Gets all transactions for a given orgId
// Shows description, amount, and date now that the transactions table has been expanded
export async function getTransactions(orgId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('transactions')
        .select('transaction_id, description, amount, date')
        .eq('org_id', orgId)
        .order('date', { ascending: false })

    if (error) throw error

    return data
}