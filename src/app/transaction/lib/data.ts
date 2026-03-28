"use server";

import { createClient } from "@/lib/supabase/server";

export async function fetchTransactions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*');

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction.');
  }

  return data;
}

export async function fetchOrgFromCurrentUser() {
  // TODO: Supposes that a user is only in one org
    const supabase = await createClient();
    const userId = await fetchUserId();

    const { data, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error('Database error:', error.message);
      throw new Error('Failed to fetch org_id from user_id.');
    }

    return data.org_id;
}

export async function fetchUserId() {
  const supabase = await createClient();
  const { data: {user} } = await supabase.auth.getUser();

  if (!user) {
    console.error('Database authorization error')
    throw new Error('Failed to fetch user_id. Authorization failure.')
  }
  return user.id;
}

export async function fetchTransactionFromId(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', transactionId);

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction from ID');
  }
  return data[0];
}
