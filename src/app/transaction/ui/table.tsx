import { DeleteTransaction, UpdateTransaction } from "@/app/transaction/ui/buttons";
import { textColors } from "../lib/styles";
import { type Transactions } from "@/app/transaction/lib/schemas";

export default async function TransactionTable({
  transactions,
  orgId,
  interactPrivelege,
}: {
  transactions: Transactions[];
  orgId: string;
  interactPrivelege: boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.02]">
              <th className="py-3 px-4 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Date</th>
              <th className="py-3 px-4 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Description</th>
              <th className="py-3 px-4 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Category</th>
              <th className="py-3 px-4 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Amount</th>
              {interactPrivelege && (
                <th className="py-3 px-4 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.transaction_id}
                className="border-b border-gray-100 dark:border-white/[0.06] last:border-b-0 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <td className="py-4 px-4 text-gray-900 dark:text-white whitespace-nowrap">
                  {transaction.date.toLocaleDateString("en-US", { dateStyle: "long" })}
                </td>
                <td className="py-4 px-4 text-gray-900 dark:text-white">
                  <p>{transaction.description}</p>
                  {transaction.notes && (
                    <p className={`hidden md:block text-xs mt-0.5 ${textColors.secondary}`}>
                      {transaction.notes}
                    </p>
                  )}
                </td>
                <td className="py-4 px-4 text-gray-900 dark:text-white whitespace-nowrap">
                  {transaction.category}
                </td>
                <td className="py-4 px-4 font-medium whitespace-nowrap">
                  <span className={transaction.type === "income" ? textColors.green : textColors.red}>
                    {transaction.type === "income"
                      ? `+${transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`
                      : `-${transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`}
                  </span>
                </td>
                {interactPrivelege && (
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <UpdateTransaction id={transaction.transaction_id} orgId={orgId} />
                      <DeleteTransaction id={transaction.transaction_id} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
