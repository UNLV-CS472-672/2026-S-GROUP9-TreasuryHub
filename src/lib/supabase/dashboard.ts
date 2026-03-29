import { createClient } from "@/lib/supabase/server";
import { fetchOrgFromCurrentUser, fetchUserId } from "@/app/transaction/lib/data";

type TransactionRow = {
  transaction_id: string;
  org_id: string;
  created_by?: string | null;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  notes?: string | null;
};

type OrganizationDashboardData = {
  scope: "organization";
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
};

type PersonalDashboardData = {
  scope: "personal";
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

export type DashboardData = OrganizationDashboardData | PersonalDashboardData;

function sumAmounts(
  transactions: TransactionRow[],
  type?: "income" | "expense"
): number {
  return transactions
    .filter((tx) => (type ? tx.type === type : true))
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const userId = await fetchUserId();
  const orgId = await fetchOrgFromCurrentUser();

  const [{ data: membership, error: membershipError }, { data: org, error: orgError }] =
    await Promise.all([
      supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("organizations")
        .select("org_name")
        .eq("org_id", orgId)
        .single(),
    ]);

  if (membershipError || !membership) {
    console.error("Dashboard membership error:", membershipError?.message);
    throw new Error("Failed to fetch user role for dashboard.");
  }

  if (orgError || !org) {
    console.error("Dashboard organization error:", orgError?.message);
    throw new Error("Failed to fetch organization name.");
  }

  const role = membership.role;
  const isOrgScope =
    role === "admin" ||
    role === "treasurer" ||
    role === "owner" ||
    role === "creator";

  if (isOrgScope) {
    const { data: transactionsRaw, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        "transaction_id, org_id, created_by, date, description, category, type, amount, notes"
      )
      .eq("org_id", orgId)
      .order("date", { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error("Dashboard transactions error:", transactionsError.message);
      throw new Error("Failed to fetch organization transactions.");
    }

    const transactions = (transactionsRaw ?? []) as TransactionRow[];

    const income = sumAmounts(transactions, "income");
    const expenses = sumAmounts(transactions, "expense");

    const [{ count: fileCount, error: filesError }, { count: auditCount, error: auditError }] =
      await Promise.all([
        supabase
          .from("files")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId),
        supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId),
      ]);

    if (filesError) {
      console.error("Dashboard files count error:", filesError.message);
    }

    if (auditError) {
      console.error("Dashboard audit count error:", auditError.message);
    }

    return {
      scope: "organization",
      orgName: org.org_name,
      summary: {
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length,
        fileCount: fileCount ?? 0,
        auditCount: auditCount ?? 0,
      },
      recentTransactions: transactions,
    };
  }

  const { data: personalTransactionsRaw, error: personalTransactionsError } =
    await supabase
      .from("transactions")
      .select(
        "transaction_id, org_id, created_by, date, description, category, type, amount, notes"
      )
      .eq("org_id", orgId)
      .eq("created_by", userId)
      .order("date", { ascending: false })
      .limit(10);

  if (personalTransactionsError) {
    console.error(
      "Dashboard personal transactions error:",
      personalTransactionsError.message
    );
    throw new Error("Failed to fetch personal transactions.");
  }

  const personalTransactions = (personalTransactionsRaw ?? []) as TransactionRow[];

  const reimbursementsTotal = sumAmounts(personalTransactions);

  const { count: uploadedFilesCount, error: uploadedFilesError } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("uploaded_by", userId);

  if (uploadedFilesError) {
    console.error(
      "Dashboard uploaded files count error:",
      uploadedFilesError.message
    );
  }

  return {
    scope: "personal",
    orgName: org.org_name,
    summary: {
      reimbursementsTotal,
      payablesTotal: 0,
      receivablesTotal: 0,
      personalTransactionCount: personalTransactions.length,
      uploadedFilesCount: uploadedFilesCount ?? 0,
    },
    recentTransactions: personalTransactions,
  };
}