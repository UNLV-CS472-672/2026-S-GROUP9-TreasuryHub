import TransactionTable from "@/app/transaction/ui/table";
import { CreateTransaction } from "@/app/transaction/ui/buttons";
import { fetchOrgTransactions, fetchOrgsOptionsFromCurrentUser, fetchRoleFromOrgIdAndUser } from "@/app/transaction/lib/data";
import OrgDropDownWrapper from "@/components/OrgDropDownWrapper";
import { Metadata } from "next";
import { canUploadFiles, canViewFiles } from "@/lib/roles";
import BackButton from "@/components/BackButton";

export const metadata : Metadata = { title: "Transactions" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}){
  const organizations = await fetchOrgsOptionsFromCurrentUser();
  const params = await searchParams;
  const orgId = params?.orgId ?? (() => {
    const fallback = organizations[0].org_id;
    console.log("No searchParam 'orgId' found. \nFalling back to: ", fallback)
    return fallback;
  })();
  const role =  await fetchRoleFromOrgIdAndUser(orgId);
  const transactions = await fetchOrgTransactions(orgId);

  const viewPrivilege = canViewFiles(role);
  const interactPrivelege = canUploadFiles(role);

  if (!viewPrivilege) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-1">
                Transactions
              </h1>
              <OrgDropDownWrapper organizations={organizations} orgId={orgId} />
            </div>
            <div className="flex items-center gap-3">
              {interactPrivelege && <CreateTransaction orgId={orgId} />}
              <BackButton />
            </div>
          </div>
          <p className="text-sm text-red-500 dark:text-red-400">
            You do not have permission to access transactions in this organization.
            Only treasurers, treasury team members, admins, executives, and advisors can access transactions.
          </p>
        </div>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-1">
              Transactions
            </h1>
            <OrgDropDownWrapper organizations={organizations} orgId={orgId} />
          </div>
          <div className="flex items-center gap-3">
            {interactPrivelege && <CreateTransaction orgId={orgId} />}
            <BackButton />
          </div>
        </div>
        <TransactionTable transactions={transactions} orgId={orgId} interactPrivelege={interactPrivelege} />
      </div>
    </main>
  );
}
