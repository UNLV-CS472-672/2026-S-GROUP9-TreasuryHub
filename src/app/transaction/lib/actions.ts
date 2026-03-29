'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchOrgFromCurrentUser } from "@/app/transaction/lib/data";
import { z } from "zod";

const TransactionSchema = z.object({
  transId: z.uuid(),
  orgId: z.uuid(),
  date: z.coerce.date().max(new Date(), "Date cannot be in future"),
  desc: z.string().nonempty("Please add description"),
  category: z.string().nonempty("Please add category"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than $0.00"),
  notes: z.string().optional()
})

const CreateTransactionSchema = TransactionSchema.omit({ transId: true })

export async function createTransaction(_prevState: any, formData: FormData) {
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser();

  const result = CreateTransactionSchema.safeParse({
    orgId: fetchOrgId,
    type: formData.get("type"),
    desc: formData.get("desc"),
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

  const {orgId, type, desc, category, amount, date, notes} = result.data;

  // Insert to database
  const { error } = await supabase
    .from('transactions')
    .insert({
      org_id: orgId, date: date, description: desc, category: category,
      type: type, amount: amount, notes: notes
    });

  if (error) {
    console.error('Database Error')
    return {
      message: 'Database Error: Failed to Create Invoice.'
    };
  }

  revalidatePath('/transaction')
  redirect('/transaction')
}
