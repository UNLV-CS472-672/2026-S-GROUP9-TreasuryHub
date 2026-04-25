import Link from "next/link";
import { deleteTransaction } from "@/app/transaction/lib/actions";
import BackButton from "@/components/BackButton";

export function CreateTransaction({ orgId }: { orgId: string }) {
  // TODO: Add plus icon to button
  return (
    <div className="flex gap-4">
      <Link href={`transaction/create?orgId=${orgId}`}>
        <button className="inline-flex items-center justify-center px-5 py-2 md:py-3 gap-2 rounded-lg bg-blue-500/80 text-gray-100 text-lg  transition-colors hover:bg-blue-500/90 cursor-pointer active:bg-blue-500">
          +
          <span className="hidden md:inline">Add Transaction</span>
        </button>
      </Link>
    </div>
  );
}

export function UpdateTransaction({ id, orgId }: { id: string, orgId: string }) {
  // TODO: Add pencil icon
  return (
    <Link href={`/transaction/${id}/edit?orgId=${orgId}`}>
      <button className="w-11 h-8 rounded-md bg-orange-500/80 text-gray-100 text-xs transition-colors hover:bg-orange-500/90 cursor-pointer active:bg-orange-500">
        Edit
      </button>
    </Link>
  );
}

export function DeleteTransaction({ id }: { id: string }) {
  const deleteTransactionWithId = deleteTransaction.bind(null, id);
  // TODO: Add trash icon
  return (
    <form action={deleteTransactionWithId}>
      <button className="w-11 h-8 rounded-md bg-red-500/80 text-gray-100 text-xs transition-colors hover:bg-red-500/90 cursor-pointer active:bg-red-500">
        Delete
      </button>
    </form>
  );
}
