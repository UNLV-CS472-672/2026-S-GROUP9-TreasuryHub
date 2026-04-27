import { DeleteTransaction, UpdateTransaction } from "@/app/transaction/ui/buttons";
import { textColors, bgColors } from "../lib/styles";
import { type Transactions } from "@/app/transaction/lib/schemas";


export default async function TransactionTable( { transactions, orgId, interactPrivelege } : { transactions: Transactions[], orgId: string, interactPrivelege: boolean } ) {
  // TODO: Add confirmation for DeleteTransaction
  const tableFieldSpacing = "px-3 py-1.5"

  return (
    <div className={`shadow-sm rounded-md ${bgColors.primary}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`${bgColors.secondary} border-b-2 border-gray-500`}>
            <tr className={`text-left text-xs md:text-sm font-semibold uppercase ${textColors.secondary} tracking-wider`}>
              <th className={tableFieldSpacing}>Date</th>
              <th className={tableFieldSpacing}>Description</th>
              <th className={tableFieldSpacing}>Category</th>
              <th className={tableFieldSpacing}>Amount</th>
              <th>
                {interactPrivelege && <div> Actions </div>}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500 text-xs md:text-sm whitespace-nowrap">
            {transactions.map((transaction) => {
              return (
                <tr key={transaction.transaction_id} className={`${textColors.primary} odd:bg-white even:bg-gray-100 dark:odd:bg-black dark:even:bg-gray-900`}>
                  <td className={tableFieldSpacing}>{transaction.date.toLocaleDateString("en-US", {dateStyle: "long"})}</td>
                  <td className={tableFieldSpacing}>
                    <div>
                      <p>
                        {transaction.description}
                      </p>
                      <p className={`hidden md:inline md:text-xs ${textColors.secondary}`}>
                        {transaction.notes}
                      </p>
                    </div>
                  </td>
                  <td className={tableFieldSpacing}>{transaction.category}</td>
                  <td className={tableFieldSpacing}>
                    <p className={transaction.type === "income"
                      ? `${textColors.green}`
                      : `${textColors.red}`
                    }
                    >
                    {transaction.type === "income"
                      ? `+${transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }) }`
                      : `-${transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}`
                    }
                    </p>
                  </td>
                  <td className={tableFieldSpacing}>
                    <div className="flex space-x-2">
                      {interactPrivelege && <UpdateTransaction id={transaction.transaction_id} orgId={orgId} />}
                      {interactPrivelege && <DeleteTransaction id={transaction.transaction_id} />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
