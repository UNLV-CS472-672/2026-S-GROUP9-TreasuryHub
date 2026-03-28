import Link from "next/link";
import { getToday } from "@/app/transaction/lib/util";
import { createTransaction } from "@/app/transaction/lib/actions";

export default function CreateTransactionForm() {
  const today = getToday();
  return (
    <form action={createTransaction}>
      <div>
        <label>Type</label>
        <select defaultValue="" name="type" required>
          <option value="" disabled>Select a type</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div>
        <label>Description</label>
        <input
          type="text" name="desc" placeholder="e.g., Event Catering" required
        />
      </div>
      <div>
        <label>Category</label>
        <input
          type="text" name="category" placeholder="University Grant" required
        />
      </div>
      <div>
        <label>Amount</label>
        <input
          type="number" name="amount" placeholder="0.00" required
        />
      </div>
      <div>
        <label>Date</label>
        <input
          type="date" name="date" defaultValue={today} required
        />
      </div>
      <div>
        <label>Notes</label>
        <input
          type="text" name="notes" placeholder="Additional details..."
        />
      </div>
      <Link href="/transaction/">
        <span>Cancel</span>
      </Link>
      <button type="submit">Add Transaction</button>
    </form>
  );
}
