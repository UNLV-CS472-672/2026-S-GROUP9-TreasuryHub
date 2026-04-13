'use client';

import Link from "next/link";
import { getToday } from "@/app/transaction/lib/util";
import { createTransaction, updateTransaction } from "@/app/transaction/lib/actions";
import { useActionState } from "react";
import type { Transactions } from "@/app/transaction/lib/schemas";

// TODO: Only remove the field that had an error: keep repsonses for the rest

export function CreateTransactionForm() {
  const today = getToday();
  const [state, formAction] = useActionState(createTransaction, null);

  return (
    <form action={formAction}>
      <div>
        <label>Type</label>
        <select defaultValue="" name="type" required>
          <option value="" disabled>Select a type</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {state?.errors?.type && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.type[0]}</p>}
      </div>
      <div>
        <label>Description</label>
        <input
          type="text" name="desc" placeholder="e.g., Event Catering"
        />
        {state?.errors?.description && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.description[0]}</p>}
      </div>
      <div>
        <label>Category</label>
        <input
          type="text" name="category" placeholder="University Grant"
        />
        {state?.errors?.category && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.category[0]}</p>}
      </div>
      <div>
        <label>Amount</label>
        <input
          type="number" name="amount" placeholder="0.00"
        />
        {state?.errors?.amount && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.amount[0]}</p>}
      </div>
      <div>
        <label>Date</label>
        <input
          type="date" name="date" defaultValue={today} required
        />
        {state?.errors?.date && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.date[0]}</p>}
      </div>
      <div>
        <label>Notes</label>
        <input
          type="text" name="notes" placeholder="Additional details..."
        />
        {state?.errors?.notes && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.notes[0]}</p>}
      </div>
      <Link href="/transaction/">
        <span>Cancel</span>
      </Link>
      <button type="submit">Add Transaction</button>
      <p>{state?.message}</p>
    </form>
  );
}

export function UpdateTransactionForm(transaction: {
  transaction: Transactions;
}) {
  const [state, formAction] = useActionState(updateTransaction, null);
  const transObj = transaction.transaction;

  return (
    <form action={formAction}>
      <div>
        <input type="hidden" name="transId" value={transObj.transaction_id} />
        <label>Type</label>
        <select defaultValue={transObj.type} name="type" required>
          <option value="" disabled>Select a type</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {state?.errors?.type && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.type[0]}</p>}
      </div>
      <div>
        <label>Description</label>
        <input
          type="text" name="desc" placeholder="e.g., Event Catering" defaultValue={transObj.description}
        />
        {state?.errors?.description && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.description[0]}</p>}
      </div>
      <div>
        <label>Category</label>
        <input
          type="text" name="category" placeholder="University Grant" defaultValue={transObj.category}
        />
        {state?.errors?.category && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.category[0]}</p>}
      </div>
      <div>
        <label>Amount</label>
        <input
          type="number" name="amount" placeholder="0.00" defaultValue={transObj.amount}
        />
        {state?.errors?.amount && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.amount[0]}</p>}
      </div>
      <div>
        <label>Date</label>
        <input
          type="date" name="date" defaultValue={String(transObj.date)} required
        />
        {state?.errors?.date && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.date[0]}</p>}
      </div>
      <div>
        <label>Notes</label>
        <input
          type="text" name="notes" placeholder="Additional details..." defaultValue={transObj.notes}
        />
        {state?.errors?.notes && <p className={state.errors ? "text-red-500" : "text-green-500"}>{state.errors.notes[0]}</p>}
      </div>
      <Link href="/transaction/">
        <span>Cancel</span>
      </Link>
      <button type="submit">Update Transaction</button>
      <p>{state?.message}</p>
    </form>
  );
}

