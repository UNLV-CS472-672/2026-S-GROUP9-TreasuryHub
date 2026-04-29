import { canViewAudit, canViewOrganizationDashboard } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { getAuditVisibilityScope } from "@/lib/roles";
import { AuditLogType } from "@/app/audit/lib/data";

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

type MembershipRow = {
  org_id: string;
  role: string;
};

type OrganizationRow = {
  org_id: string;
  org_name: string;
  logo_path?: string | null;
};

type OrganizationListItem = {
  org_id: string;
  org_name: string;
  role: string;
  logo_path: string | null;
  logo_url: string | null;
};

type OrganizationDashboardData = {
  scope: "organization";
  orgId: string;
  orgName: string;
  role: string;
  organizations: OrganizationListItem[];
  roleOptions: string[];
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
  orgId: string;
  orgName: string;
  role: string;
  organizations: OrganizationListItem[];
  roleOptions: string[];
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

export async function getDashboardData(
  selectedOrgId?: string
): Promise<DashboardData> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  
  const { data: membershipsRaw, error: membershipsError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id);

  if (membershipsError) {
    console.error("Dashboard memberships error:", membershipsError.message);
    throw new Error("Failed to fetch organizations.");
  }

  const memberships = (membershipsRaw ?? []) as MembershipRow[];

  if (memberships.length === 0) {
    throw new Error("No organization found.");
  }

  const orgIds = memberships.map((membership) => membership.org_id);

    
  const { data: orgsRaw, error: orgsError } = await supabase
    .from("organizations")
    .select("org_id, org_name, logo_path")
    .in("org_id", orgIds);

  if (orgsError) {
    console.error("Dashboard organizations error:", orgsError.message);
    throw new Error("Failed to fetch organization names.");
  }

  const { data: orgRoles } = await supabase
  .from("org_members")
  .select("role")
  .eq("org_id", orgIds);

const roleOptions = Array.from(
  new Set((orgRoles ?? []).map((member) => member.role))
);
  const orgs = (orgsRaw ?? []) as OrganizationRow[];
  const orgMap = new Map(orgs.map((org) => [org.org_id, org]));

  const organizations: OrganizationListItem[] = [];

  for (const membership of memberships) {
    const org = orgMap.get(membership.org_id);
  
    if (!org) {
      continue;
    }
  
    let logoUrl: string | null = null;
  
    if (org.logo_path) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("organization-logos")
          .createSignedUrl(org.logo_path, 60 * 60);
  
      if (!signedUrlError) {
        logoUrl = signedUrlData.signedUrl;
      }
    }
  
    organizations.push({
      org_id: membership.org_id,
      org_name: org.org_name,
      role: membership.role,
      logo_path: org.logo_path ?? null,
      logo_url: logoUrl,
    });
  }

  if (organizations.length === 0) {
    throw new Error("No organization found.");
  }

  const activeOrganization =
    organizations.find((org) => org.org_id === selectedOrgId) ??
    organizations[0];

  const orgId = activeOrganization.org_id;
  const orgName = activeOrganization.org_name;
  const role = activeOrganization.role;

  const isOrgScope = canViewOrganizationDashboard(role);

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

    const { count: fileCount, error: filesError } = await supabase
      .from("files")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (filesError) {
      console.error("Dashboard files count error:", filesError.message);
    }

    let auditCount = 0;

    if (canViewAudit(role)) {
      let auditQuery = supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId);
    
      const auditVisibilityScope = getAuditVisibilityScope(role);
    
      if (auditVisibilityScope === "financial_only") {
        auditQuery = auditQuery.eq("type", AuditLogType.FINANCIAL);
      }
    
      const { count, error: auditError } = await auditQuery;
    
      if (auditError) {
        console.error("Dashboard audit count error:", auditError.message);
      }
    
      auditCount = count ?? 0;
    }

    return {
      scope: "organization",
      orgId,
      orgName,
      role,
      organizations,
      roleOptions,
      summary: {
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length,
        fileCount: fileCount ?? 0,
        auditCount,
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
      .eq("created_by", user.id)
      .order("date", { ascending: false })
      .limit(10);

  if (personalTransactionsError) {
    console.error(
      "Dashboard personal transactions error:",
      personalTransactionsError.message
    );
    throw new Error("Failed to fetch personal transactions.");
  }

  const personalTransactions = (personalTransactionsRaw ??
    []) as TransactionRow[];

  const reimbursementsTotal = sumAmounts(personalTransactions);

  const { count: uploadedFilesCount, error: uploadedFilesError } = await supabase
    .from("files")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("uploaded_by", user.id);

  if (uploadedFilesError) {
    console.error(
      "Dashboard uploaded files count error:",
      uploadedFilesError.message
    );
  }

  return {
    scope: "personal",
    orgId,
    orgName,
    role,
    organizations,
    roleOptions,
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