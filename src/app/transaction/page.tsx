import TransactionTable from "@/app/transaction/ui/table";
import { CreateTransaction } from "@/app/transaction/ui/buttons";
import { textColors } from "./lib/styles";
import { fetchOrgTransactions, fetchOrgsOptionsFromCurrentUser } from "@/app/transaction/lib/data";
import OrgDropDownWrapper from "@/components/OrgDropDownWrapper";
import { type OrgOptions } from "./lib/schemas";

export const metadata = { title: "Transactions" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}){
  const organizations : OrgOptions[] = await fetchOrgsOptionsFromCurrentUser();
  const params = await searchParams;
  console.warn("Params", params)
  const orgId = params?.orgId ?? (() => {
    const fallback = organizations[0].org_id;
    console.log("No searchParam 'orgId' found. \nFalling back to: ", fallback)
    return fallback;
  })();
  const transactions = await fetchOrgTransactions(orgId);
  
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${textColors.primary} mb-1`}>
              Transactions
            </h1>
            <OrgDropDownWrapper organizations={organizations} />
            <p className={`${textColors.secondary}`}>
            </p>
          </div>
          <CreateTransaction />
        </div>
        <div>
          <TransactionTable transactions={transactions}/>
        </div>
      </div>
    </main>
  );
}
