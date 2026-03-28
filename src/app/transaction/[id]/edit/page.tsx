import { fetchTransactionFromId } from "@/app/transaction/lib/data";
import { UpdateTransactionForm } from "../../ui/form";
import { type Transaction } from "../../lib/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const transaction = await fetchTransactionFromId(id);
  return (
    <main>
      <UpdateTransactionForm transaction={transaction} />
    </main>
  );
}
