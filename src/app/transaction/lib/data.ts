"use server"

import { createClient } from "@/lib/supabase/server";

// Fetches all transactions across all orgs.
// Returns: Transaction[]
export async function fetchAllTransactions() {
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

// Fetches all transactions belonging to a specific org.
// Returns: Transaction[]
export async function fetchOrgTransactions(currentOrgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq("org_id", currentOrgId);

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction.');
  }

  return data;
}

// TODO: Phase out in favor of fetchOrgsFromCurrentUser() or fetchCurrentOrgFromURL() or OrgDropDownWrapper
// Returns the org_id of the first org found for the current user
export async function fetchOrgFromCurrentUser() {
    const supabase = await createClient();
    const userId = await fetchUserId();

    const { data, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error('Database error:', error.message);
      throw new Error('Failed to fetch org_id from user_id.');
    }

    return data[0].org_id;
}

// Fetches all orgs the current user is a member of
// Returns { org_id }[]
export async function fetchOrgsFromCurrentUser() {
    const supabase = await createClient();
    const userId = await fetchUserId();

    const { data, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq("user_id", userId);

    if (error) {
      console.error('Database error:', error.message);
      throw new Error('Failed to fetch org_id from user_id.');
    }

    return data;
}

// Returns the userId of the currently authenticated Supbase user.
// Throws: If authenticated
export async function fetchUserId() {
  const supabase = await createClient();
  const { data: {user} } = await supabase.auth.getUser();

  if (!user) {
    console.error('Database authorization error')
    throw new Error('Failed to fetch user_id. Authorization failure.')
  }
  return user.id;
}

// Fetches a single transactions by its ID
// Returns: Transaction or undefined if not found
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
