'use client';

import Link from "next/link";
import { getToday } from "@/app/transaction/lib/util";
import { createTransaction, updateTransaction } from "@/app/transaction/lib/actions";
import React, { useActionState } from "react";
import type { Transactions } from "@/app/transaction/lib/schemas";
import { bgColors, textColors } from "../lib/styles";

// TODO: Only remove the field that had an error: keep repsonses for the rest

function Field({ label, error, children }: {
  label: string,
  error?: string[],
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`${bgColors.secondary} text-xs font-semibold uppercase tracking-widest ${textColors.secondary} p-2`}>
        {label}
      </label>
      {children}
      {error && <p className={`text-xs ${textColors.red}`}>{error[0]}</p>}
    </div>
  )
}

const inputClass = `dark:bg-black dark:focus:bg-gray-900 rounded-md px-2 py-1 border border-gray-500/50`

export function CreateTransactionForm({ orgId }: { orgId: string }) {
  const today = getToday();
  const [state, formAction] = useActionState(createTransaction, null);

  return (
    <div className="flex flex-col px-4 py-8 pb-16 max-w-7xl mx-auto">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight ${textColors.primary}">
        New Transaction
      </h2>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="orgId" value={orgId} />

        <Field label="Description" error={state?.errors?.description}>
          <input type="text" name="desc" placeholder="e.g., Event Catering" className={inputClass} />
        </Field>
        <Field label="Type" error={state?.errors?.type}>
          <select defaultValue="" name="type" className={inputClass} required>
            <option value="" disabled>Select a type</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </Field>
        <Field label="Amount" error={state?.errors?.amount}>
          <input type="number" name="amount" placeholder="0.00" step="0.01" min="0" className={inputClass} />
        </Field>
        <Field label="Date" error={state?.errors?.date}>
          <input type="date" name="date" defaultValue={today} required className={inputClass} />
        </Field>
        <Field label="Category" error={state?.errors?.category}>
          <input type="text" name="category" placeholder="University Grant" className={inputClass} />
        </Field>
        <Field label="Notes" error={state?.errors?.notes}>
          <textarea name="notes" placeholder="Additional details..." rows={3} className={`${inputClass} resize-none`} />
        </Field>

        {state?.message && ( <p className="text-sm text-red-400">{state.message}</p>)}

        <div className="flex justify-around">
          <Link href={`/transaction?orgId=${orgId}`} className="inline-flex items-center justify-center px-5 py-2 md:py-3 gap-2 rounded-lg bg-red-500/80 text-gray-100 text-lg  transition-colors hover:bg-red-500/90 cursor-pointer active:bg-red-500">
            Cancel
          </Link>
          <button type="submit" className="inline-flex items-center justify-center px-5 py-2 md:py-3 gap-2 rounded-lg bg-blue-500/80 text-gray-100 text-lg  transition-colors hover:bg-blue-500/90 cursor-pointer active:bg-blue-500">
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
}

export function UpdateTransactionForm({ transaction, orgId }: {
  transaction: Transactions;
  orgId: string;
}) {
  const [state, formAction] = useActionState(updateTransaction, null);

  return (
    <div className="flex flex-col px-4 py-8 pb-16 max-w-7xl mx-auto">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight ${textColors.primary}">
        Modify Transaction
      </h2>
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="transId" value={transaction.transaction_id} />
        <input type="hidden" name="orgId" value={orgId} />

        <Field label="Description" error={state?.errors?.description}>
          <input type="text" name="desc" placeholder="e.g., Event Catering" className={inputClass} defaultValue={transaction.description} />
        </Field>
        <Field label="Type" error={state?.errors?.type}>
          <select defaultValue={transaction.type} name="type" className={inputClass} required>
            <option value="" disabled>Select a type</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </Field>
        <Field label="Amount" error={state?.errors?.amount}>
          <input type="number" name="amount" placeholder="0.00" step="0.01" min="0" className={inputClass} defaultValue={transaction.amount} />
        </Field>
        <Field label="Date" error={state?.errors?.date}>
          {/*TODO: Find a better way of setting date string*/}
          <input type="date" name="date" defaultValue={transaction.date.toLocaleDateString('en-CA')} required className={inputClass} />
        </Field>
        <Field label="Category" error={state?.errors?.category}>
          <input type="text" name="category" placeholder="University Grant" className={inputClass} defaultValue={transaction.category} />
        </Field>
        <Field label="Notes" error={state?.errors?.notes}>
          <textarea name="notes" placeholder="Additional details..." rows={3} className={`${inputClass} resize-none`} defaultValue={transaction.notes ?? undefined}/>
        </Field>

        {state?.message && ( <p className="text-sm text-red-400">{state.message}</p>)}

        <div className="flex justify-around">
          <Link href={`/transaction?orgId=${orgId}`} className="inline-flex items-center justify-center px-5 py-2 md:py-3 gap-2 rounded-lg bg-red-500/80 text-gray-100 text-lg  transition-colors hover:bg-red-500/90 cursor-pointer active:bg-red-500">
            Cancel
          </Link>
          <button type="submit" className="inline-flex items-center justify-center px-5 py-2 md:py-3 gap-2 rounded-lg bg-blue-500/80 text-gray-100 text-lg  transition-colors hover:bg-blue-500/90 cursor-pointer active:bg-blue-500">
            Update Transaction
          </button>
        </div>
      </form>
    </div>
  );
}

