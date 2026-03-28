'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fetchOrgFromCurrentUser } from "@/app/transaction/lib/data";
import { z } from "zod";

const TransactionSchema = z.object({
  transId: z.uuid({ error: "Bad trans" }),
  orgId: z.uuid({ error: "Bad org" }),
  date: z.coerce.date({ error: "Bad date" }),
  desc: z.string({ error: "Bad desc" }),
  category: z.string({ error: "Bad cat" }),
  type: z.enum(["income", "expense"], {error: "Bad type"}),
  amount: z.coerce.number({ error: "Bad amt" }).positive(),
  notes: z.string({ error: "Bad notes" }).optional()
})

const CreateTransactionSchema = TransactionSchema.omit({ transId: true })

export async function createTransaction(formData: FormData) {
  console.log('Inside createTransaction');
  const supabase = await createClient();
  const fetchOrgId = await fetchOrgFromCurrentUser();

  const { orgId, type, desc, category, amount, date,
    notes } = CreateTransactionSchema.parse({
      orgId: fetchOrgId,
      type: formData.get("type"),
      desc: formData.get("desc"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      notes: formData.get("notes"),
    });

  const { error } = await supabase
    .from('transactions')
    .insert({
      type: type, description: desc, category: category,
      amount: amount, date: date, notes: notes, org_id: orgId,
    });

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to insert transaction.');
  }

  revalidatePath('/transaction')
  redirect('/transaction')
}
