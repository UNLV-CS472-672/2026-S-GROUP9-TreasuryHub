/**
 * DASHBOARD DATA LAYER
 *
 * - Fetches all data needed for the dashboard
 * - Handles role-based logic (org vs personal)
 * - Runs ONLY on server (uses Supabase + cookies)
 */

import "server-only";
import { createClient } from "./server";

/**
 * Roles that can see organization-wide financial data
 */
const ORG_WIDE_ROLES = [
  "treasurer",
  "treasury_team",
  "executive",
  "advisor",
] as const;

/**
 * Check if a role has access to org-wide dashboard
 */
function canViewOrgDashboard(role: string) {
  return ORG_WIDE_ROLES.includes(role as (typeof ORG_WIDE_ROLES)[number]);
}

/**
 * Transaction shape used in UI
 */
type TransactionRow = {
  transaction_id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  notes: string | null;
};

/**
 * Dashboard return type
 */
type DashboardData =
  | {
      scope: "organization";
      role: string;
      orgName: string;
      summary: {
        income: number;
        expenses: number;
        net: number;
        transactionCount: number;
        fileCount: number;
        auditCount: number;
      };
      recentTransactions: TransactionRow[];
    }
  | {
      scope: "personal";
      role: string;
      orgName: string;
      summary: {
        reimbursementsTotal: number;
        payablesTotal: number;
        receivablesTotal: number;
        personalTransactionCount: number;
        uploadedFilesCount: number;
      };
      recentTransactions: TransactionRow[];
    };

/**
 * MAIN FUNCTION
 * Builds dashboard data based on user + role
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  // =============================
  // 🔐 1. GET CURRENT USER
  // =============================
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // =============================
  // 🧩 2. GET USER MEMBERSHIP
  // =============================
  // Determines:
  // - which organization user belongs to
  // - what role they have
  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Membership lookup failed: ${membershipError.message}`);
  }

  if (!membership) {
    throw new Error("User is not part of any organization");
  }

  const orgId = membership.org_id;
  const role = membership.role as string;

  // =============================
  // 🏢 3. GET ORGANIZATION NAME
  // =============================
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("org_name")
    .eq("org_id", orgId)
    .single();

  if (orgError || !org) {
    throw new Error("Failed to fetch organization");
  }

  const orgName = org.org_name;

  // =============================
  // 🏢 4. ORGANIZATION DASHBOARD
  // =============================
  // For treasurer / exec / advisor roles
  if (canViewOrgDashboard(role)) {
    const [
      incomeRes,
      expenseRes,
      txRes,
      filesRes,
      auditRes,
    ] = await Promise.all([
      // Get all income
      supabase
        .from("transactions")
        .select("amount")
        .eq("org_id", orgId)
        .eq("type", "income"),

      // Get all expenses
      supabase
        .from("transactions")
        .select("amount")
        .eq("org_id", orgId)
        .eq("type", "expense"),

      // Get recent transactions for table
      supabase
        .from("transactions")
        .select(
          "transaction_id, date, description, category, type, amount, notes",
          { count: "exact" },
        )
        .eq("org_id", orgId)
        .order("date", { ascending: false })
        .limit(8),

      // Count uploaded files
      supabase
        .from("files")
        .select("file_id", { count: "exact", head: true })
        .eq("org_id", orgId),

      // Count audit logs
      supabase
        .from("audit_logs")
        .select("audit_id", { count: "exact", head: true })
        .eq("org_id", orgId),
    ]);

    // Handle any errors
    if (incomeRes.error) throw incomeRes.error;
    if (expenseRes.error) throw expenseRes.error;
    if (txRes.error) throw txRes.error;
    if (filesRes.error) throw filesRes.error;
    if (auditRes.error) throw auditRes.error;

    // Calculate totals
    const income = (incomeRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    const expenses = (expenseRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return {
      scope: "organization",
      role,
      orgName,
      summary: {
        income,
        expenses,
        net: income - expenses,
        transactionCount: txRes.count ?? 0,
        fileCount: filesRes.count ?? 0,
        auditCount: auditRes.count ?? 0,
      },
      recentTransactions: (txRes.data ?? []).map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
      })),
    };
  }

  // =============================
  // 👤 5. PERSONAL DASHBOARD
  // =============================
  // Members only see their own activity

  // We infer "ownership" using files uploaded by the user
  const filesForUserRes = await supabase
    .from("files")
    .select("transaction_id")
    .eq("org_id", orgId)
    .eq("uploaded_by", user.id)
    .not("transaction_id", "is", null);

  if (filesForUserRes.error) throw filesForUserRes.error;

  const personalTransactionIds = (filesForUserRes.data ?? [])
    .map((f) => f.transaction_id)
    .filter(Boolean) as string[];

  // No personal data yet
  if (personalTransactionIds.length === 0) {
    return {
      scope: "personal",
      role,
      orgName,
      summary: {
        reimbursementsTotal: 0,
        payablesTotal: 0,
        receivablesTotal: 0,
        personalTransactionCount: 0,
        uploadedFilesCount: 0,
      },
      recentTransactions: [],
    };
  }

  const [myTransactionsRes, myFilesCountRes] = await Promise.all([
    // Get personal transactions
    supabase
      .from("transactions")
      .select(
        "transaction_id, date, description, category, type, amount, notes",
      )
      .eq("org_id", orgId)
      .in("transaction_id", personalTransactionIds)
      .order("date", { ascending: false })
      .limit(8),

    // Count user's uploaded files
    supabase
      .from("files")
      .select("file_id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("uploaded_by", user.id),
  ]);

  if (myTransactionsRes.error) throw myTransactionsRes.error;
  if (myFilesCountRes.error) throw myFilesCountRes.error;

  const myTransactions: TransactionRow[] = (myTransactionsRes.data ?? []).map(
    (tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }),
  );

  // Infer categories (since schema doesn't define ownership types)
  const reimbursementsTotal = myTransactions
    .filter((tx) =>
      /reimbursement/i.test(`${tx.category} ${tx.description} ${tx.notes ?? ""}`),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const payablesTotal = myTransactions
    .filter((tx) =>
      /payable/i.test(`${tx.category} ${tx.description} ${tx.notes ?? ""}`),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const receivablesTotal = myTransactions
    .filter((tx) =>
      /receivable/i.test(`${tx.category} ${tx.description} ${tx.notes ?? ""}`),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    scope: "personal",
    role,
    orgName,
    summary: {
      reimbursementsTotal,
      payablesTotal,
      receivablesTotal,
      personalTransactionCount: myTransactions.length,
      uploadedFilesCount: myFilesCountRes.count ?? 0,
    },
    recentTransactions: myTransactions,
  };
}