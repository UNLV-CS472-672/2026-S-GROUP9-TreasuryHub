import { createClient } from './supabase/client'

// Uploads a file to the supabase storage, and to the files table
export async function uploadFile(file: File, orgId: string, fileType: 'receipt' | 'document', transactionId?: string) {
    const supabase = createClient()

    // Get the current user so we can save uploaded_by
    const { data: { user } } = await supabase.auth.getUser()

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
            uploaded_by: user?.id || null,
        })
        .select()
        .single()

    if (dbError) throw dbError

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