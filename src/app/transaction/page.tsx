import TransactionTable from "@/app/transaction/ui/table";
import { CreateTransaction } from "@/app/transaction/ui/buttons";
import { textColors } from "./lib/styles";

export default function page(){
  // TODO: Restrict display to only user_org
  // TODO: Add layout page

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 pb-16">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${textColors.primary} mb-1`}>
              Transaction
            </h1>
            <p className={`${textColors.secondary}`}>
              8 Transactions (Change)
            </p>
          </div>
          <CreateTransaction />
        </div>
        <div>
          <TransactionTable />
        </div>
      </div>
    </main>
  );
}
