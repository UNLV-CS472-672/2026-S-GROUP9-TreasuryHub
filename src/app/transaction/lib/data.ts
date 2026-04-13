"use server"

import { createClient } from "@/lib/supabase/server";
import { TransactionsSchema, OrgMembersSchema, type Transactions, type OrgMembers, OrgOptionsSchema, OrgOptions } from "@/app/transaction/lib/schemas";

// Fetches all transactions across all orgs.
// Returns: Transaction[]
export async function fetchAllTransactions(): Promise<Transactions[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*');

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction.');
  }

  return TransactionsSchema.array().parse(data);
}

// Fetches all transactions belonging to a specific org.
// Returns: Transaction[]
export async function fetchOrgTransactions(currentOrgId: string): Promise<Transactions[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq("org_id", currentOrgId);

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction.');
  }

  return TransactionsSchema.array().parse(data);
}

// TODO: Phase out in favor of fetchOrgsFromCurrentUser() or fetchCurrentOrgFromURL() or OrgDropDownWrapper
// Returns the org_id of the first org found for the current user
export async function fetchOrgFromCurrentUser() : Promise<OrgMembers> {
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

    return OrgMembersSchema.parse(data[0].org_id);
}

// Fetches all orgs the current user is a member of
// Returns { org_id }[]
export async function fetchOrgsFromCurrentUser() : Promise<OrgMembers[]> {
    const supabase = await createClient();
    const userId = await fetchUserId();

    const { data, error } = await supabase
      .from('org_members')
      .select('org_id')
      .eq("user_id", userId);

    if (error) {
      console.error('Database error:', error.message);
      throw new Error('Failed to fetch orgs from user_id.');
    }

    return OrgMembersSchema.array().parse(data);
}

// Returns the userId of the currently authenticated Supbase user.
// Throws: If authenticated
export async function fetchUserId() : Promise<string>{
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
export async function fetchTransactionFromId(transactionId: string) : Promise<Transactions> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', transactionId);

  if (error) {
    console.error('Database error:', error.message);
    throw new Error('Failed to fetch transaction from ID');
  }
  return TransactionsSchema.parse(data[0]);
}

// Create function for fetching orgOptions
export async function fetchOrgsOptionsFromCurrentUser() : Promise<OrgOptions[]> {
    const supabase = await createClient();
    const userId = await fetchUserId();

    // data OrgOptionsSchema
    const { data, error } = await supabase
      .from('organizations')
      .select(`org_id, 
              org_name,
              org_members!inner ( role )`)
      .eq("org_members.user_id", userId);

    if (error) {
      console.error('Database error:', error.message);
      throw new Error('Failed to fetch org options from user_id.');
    }

    const mappedData = data.map( ({ org_members, ...org }) => ({
      ...org,
      role: org_members[0].role,
    }) )

    console.warn(mappedData)

    return OrgOptionsSchema.array().parse(mappedData);
}
