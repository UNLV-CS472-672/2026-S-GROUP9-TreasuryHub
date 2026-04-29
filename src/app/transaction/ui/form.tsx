'use client';

import Link from "next/link";
import { getToday } from "@/app/transaction/lib/util";
import { createTransaction, updateTransaction } from "@/app/transaction/lib/actions";
import React, { useActionState } from "react";
import type { Transactions } from "@/app/transaction/lib/schemas";
import { textColors } from "../lib/styles";

const inputClass =
  "w-full rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, error, children }: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-neutral-400">
        {label}
      </label>
      {children}
      {error && <p className={`text-xs ${textColors.red}`}>{error[0]}</p>}
    </div>
  );
}

export function CreateTransactionForm({ orgId }: { orgId: string }) {
  const today = getToday();
  const [state, formAction] = useActionState(createTransaction, null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          New Transaction
        </h1>

        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
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

            {state?.message && <p className="text-sm text-red-500 dark:text-red-400">{state.message}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href={`/transaction?orgId=${orgId}`}
                className="rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.05] px-5 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
              >
                Add Transaction
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export function UpdateTransactionForm({ transaction, orgId }: {
  transaction: Transactions;
  orgId: string;
}) {
  const [state, formAction] = useActionState(updateTransaction, null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-8 lg:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Modify Transaction
        </h1>

        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
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
              <input type="date" name="date" defaultValue={transaction.date.toLocaleDateString('en-CA')} required className={inputClass} />
            </Field>
            <Field label="Category" error={state?.errors?.category}>
              <input type="text" name="category" placeholder="University Grant" className={inputClass} defaultValue={transaction.category} />
            </Field>
            <Field label="Notes" error={state?.errors?.notes}>
              <textarea name="notes" placeholder="Additional details..." rows={3} className={`${inputClass} resize-none`} defaultValue={transaction.notes ?? undefined} />
            </Field>

            {state?.message && <p className="text-sm text-red-500 dark:text-red-400">{state.message}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href={`/transaction?orgId=${orgId}`}
                className="rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.05] px-5 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
              >
                Update Transaction
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
