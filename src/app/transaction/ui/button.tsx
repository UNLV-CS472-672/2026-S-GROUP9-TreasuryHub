import Link from "next/link";

export default function CreateTransaction() {
  // TODO: Add plus to button
  return(
    <Link href="transaction/create">
      <button className="bg-red-400">+ Add Transaction</button>
    </Link>
  );
}
