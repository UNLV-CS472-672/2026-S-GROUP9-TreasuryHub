import { fetchTransactions } from "@/app/transaction/lib/data";
import { DeleteTransaction, UpdateTransaction } from "@/app/transaction/ui/buttons";


export default async function TransactionTable() {
  // TODO: Add color and formatting
  // TODO: Add confirmation for DeleteTransaction

  const transactions = await fetchTransactions();
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          return (
            <tr key={transaction.transaction_id}>
              <td>{transaction.date}</td>
              <td>{transaction.description}</td>
              <td>{transaction.category}</td>
              <td>{transaction.amount}</td>
              <td>{transaction.type}</td>
              <td>{transaction.notes}</td>
              <td><UpdateTransaction id={transaction.transaction_id} /></td>
              <td><DeleteTransaction id={transaction.transaction_id} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
