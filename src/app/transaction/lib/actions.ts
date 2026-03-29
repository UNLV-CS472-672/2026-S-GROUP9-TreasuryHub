'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchOrgFromCurrentUser, fetchUserId  } from "@/app/transaction/lib/data";
import { z } from "zod";

const TransactionSchema = z.object({
  transaction_id: z.uuid(),
  orgId: z.uuid(),
  date: z.coerce.date().max(new Date(), "Date cannot be in future"),
  description: z.string().nonempty("Please add description"),
  category: z.string().nonempty("Please add category"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than $0.00"),
  notes: z.string().optional()
})

const CreateTransactionSchema = TransactionSchema.omit({ transaction_id: true })

export async function createTransaction(_prevState: any, formData: FormData) {
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser();
  const userId = await fetchUserId();

  const result = CreateTransactionSchema.safeParse({
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
    };
  } 

  const { orgId, type, description , category, amount, date, notes } = result.data;

  // Insert to database
  const { error } = await supabase
    .from('transactions')
    .insert({
      org_id: orgId, created_by: userId, date: date, description: description, category: category,
      type: type, amount: amount, notes: notes
    });

  if (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Create Transaction.'
    };
  }

  revalidatePath('/transaction')
  revalidatePath("/dashboard");
  redirect('/transaction')
}

export async function updateTransaction(_prevState: any, formData: FormData) {
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser();

  const result = TransactionSchema.safeParse({
    transaction_id: formData.get("transId"),
    orgId: fetchOrgId,
    type: formData.get("type"),
    description: formData.get("description"),
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


  const { transaction_id, orgId, type, description, category, amount, date, 
          notes } = result.data;

  // Update database
  const { error } = await supabase
    .from('transactions')
    .update({
      org_id: orgId, date, description,
      category, type, amount, notes
    })
    .eq("transaction_id", transaction_id);



  // TODO: Handle error better
  if (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Update Transaction.'
    };
  }

  revalidatePath('/transaction')
  redirect('/transaction')
}

export type Transaction = z.infer<typeof TransactionSchema>;
