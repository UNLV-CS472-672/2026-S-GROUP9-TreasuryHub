import TransactionTable from "@/app/transaction/ui/table";
import { CreateTransaction } from "@/app/transaction/ui/buttons";
import { textColors } from "./lib/styles";
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
    <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
        <h1 className={`text-2xl font-semibold ${textColors.primary} mb-1`}>
          Transactions
        </h1>
            <OrgDropDownWrapper organizations={organizations} orgId={orgId} />
            <p className={`${textColors.secondary}`}></p>
          </div>
          <div className="grid grid-flow-col grid-rows-1 gap-4">
            {interactPrivelege && <CreateTransaction orgId={orgId} />}
            <BackButton />
          </div>
        </div>
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-red-400">
          You do not have permission to access transactions in this organization.
          Only treasurers, treasury team members, admins, executives, and advisors can access transactions.
        </p>
      </div>
      </div>
    </main>
    )
  }
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${textColors.primary} mb-1`}>
              Transactions
            </h1>
            <OrgDropDownWrapper organizations={organizations} orgId={orgId} />
            <p className={`${textColors.secondary}`}></p>
          </div>
          <div className="grid grid-flow-col grid-rows-1 gap-4">
            {interactPrivelege && <CreateTransaction orgId={orgId} />}
            <BackButton />
          </div>
        </div>
        <div>
          <TransactionTable transactions={transactions} orgId={orgId} interactPrivelege={interactPrivelege}/>
        </div>
      </div>
    </main>
  );
}
