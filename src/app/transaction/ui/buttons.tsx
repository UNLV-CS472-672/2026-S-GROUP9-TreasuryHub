import Link from "next/link";

export function CreateTransaction() {
  // TODO: Add plus to button
  return(
    <Link href="transaction/create">
      <button className="bg-red-400">+ Add Transaction</button>
    </Link>
  );
}

export function UpdateTransaction({ id }: { id:string }) {
  return(
    <Link href={ `/transaction/${id}/edit` }>
      <button className="bg-green-400">Edit</button>
    </Link>
  );
}

export function DeleteTransaction() {
  return(
    // <Link href="transaction/create">
      <button className="bg-orange-400">- Delete</button>
    // </Link>
  );
}
