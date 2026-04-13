'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchOrgFromCurrentUser, fetchUserId } from "@/app/transaction/lib/data";
import { z } from "zod";
import { logAuditEntry } from "@/app/audit/lib/action";
import { AuditLogType } from "@/app/audit/lib/data";
import { TransactionsSchema, type ActionState } from "@/app/transaction/lib/schemas";

const CreateTransactionSchema = TransactionsSchema.omit({ transaction_id: true })

export async function createTransaction(_prevState: ActionState, formData: FormData) : Promise<ActionState> {
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser(); // TODO: Replace
  const userId = await fetchUserId();

  const result = CreateTransactionSchema.safeParse({
    org_id: fetchOrgId,
    type: formData.get("type"),
    description: formData.get("desc"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    notes: formData.get("notes"),
  });

  if (!result.success) {
    return {
      errors: z.flattenError(result.error).fieldErrors,
    };
  }

  const { org_id, type, description, category, amount, date, notes } = result.data;

  // Insert to database
  // I updated the insertion statement to return the inserted row
  // This allows us to get the generated transaction_id which is needed for the audit log entry
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      org_id, created_by: userId, date, description, category,
      type, amount, notes
    })
    .select()
    .single();

  if (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Create Transaction.'
    };
  }

  // Fetch the user's role
  const { data: roleData, error: roleError } = await supabase
  .from("org_members")
  .select("role")
  .eq("user_id", userId)
  .eq("org_id", orgId)
  .single()

  if(roleError) {
    console.error(error)
    return {
      message: "Database Error: Failed to fetch current user's role of active organization"
    };
  }

  // Insert audit log entry for transaction creation
  await logAuditEntry({
    orgId: org_id,
    userId: userId,
    action: "CREATE",
    entity_type: "transaction",
    entity_id: data.transaction_id,
    before_data: null,
    after_data: {
      description, category, type, amount, date, notes
    },
    type: AuditLogType.FINANCIAL,
    display_role: roleData?.role,
  });

  revalidatePath('/transaction')
  revalidatePath("/dashboard");
  redirect('/transaction')
}

export async function updateTransaction(_prevState: ActionState, formData: FormData) : Promise<ActionState> {
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser(); // TODO: Replace

  const result = TransactionsSchema.safeParse({
    transaction_id: formData.get("transId"),
    orgId: fetchOrgId,
    type: formData.get("type"),
    description: formData.get("desc"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    notes: formData.get("notes"),
  });


  if (!result.success) {
    return {
      errors: z.flattenError(result.error).fieldErrors,
      message: z.flattenError(result.error).formErrors,
    };
  }


  const { transaction_id, org_id, type, description, category, amount, date,
    notes } = result.data;

  // Fetch existing transaction data before update for audit log
  const { data: beforeData, error: beforeDataError } = await supabase
    .from("transactions")
    .select("*")
    .eq("transaction_id", transaction_id)
    .single();

  if (beforeDataError) {
    console.error(beforeDataError);
    return {
      message: 'Database Error: Failed to Fetch Existing Transaction Data.',
    };
  }

  // Update database
  const { data: afterData, error } = await supabase
    .from('transactions')
    .update({
      org_id, date, description,
      category, type, amount, notes
    })
    .eq("transaction_id", transaction_id)
    .select()
    .single();


  if (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Update Transaction.'
    };
  }

  // Fetch current user's role
  const { data: roleData, error: roleError } = await supabase
  .from('org_members')
  .select('role') 
  .eq('user_id', beforeData.created_by)
  .eq('org_id', orgId)
  .single()

  if (roleError){
    console.error(roleError);
    return {
      message: "Database Error: Failed to fetch current user's role of active organization"
    };
  }

  // Insert audit log entry for transaction update
  // Only log if there are changes to the transaction data
  if (JSON.stringify(beforeData) !== JSON.stringify(afterData)) {
    await logAuditEntry({
      orgId: org_id,
      userId: beforeData.created_by,
      action: "UPDATE",
      entity_type: "transaction",
      entity_id: transaction_id,
      before_data: beforeData,
      after_data: afterData,
      type: AuditLogType.FINANCIAL,
      display_role: roleData?.role,
    });
  }

  revalidatePath('/transaction')
  redirect('/transaction')
}

export async function deleteTransaction(transaction_id: string, _formData: FormData) : Promise<ActionState> {
  const supabase = await createClient();

  // Fetch existing transaction data before deletion for audit log
  const { data: beforeData, error: beforeDataError } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', transaction_id)
    .single();

  if (beforeDataError || !beforeData) {
    console.error(beforeDataError);
    return {
      message: `Error: ${beforeDataError}`
    };
  }

  const { data: roleData, error: roleError } = await supabase
  .from('org_members')
  .select('role')
  .eq('user_id', beforeData.created_by)
  .eq('org_id', beforeData.org_id)
  .single()

  if (roleError){
    console.error(roleError);
    return;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq("transaction_id", transaction_id);
  if (error) {
    console.error('Database Error: Failed to Delete Transaction.', error)
  }

  // Insert audit log entry for transaction deletion
  await logAuditEntry({
    orgId: beforeData.org_id,
    userId: beforeData.created_by,
    action: "DELETE",
    entity_type: "transaction",
    entity_id: transaction_id,
    before_data: beforeData,
    after_data: null,
    type: AuditLogType.FINANCIAL,
    display_role: roleData?.role,
  });

  revalidatePath('/transaction')
}
