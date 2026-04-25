import { fetchOrgsOptionsFromCurrentUser, fetchTransactionFromId } from "@/app/transaction/lib/data";
import { UpdateTransactionForm } from "../../ui/form";
import { Metadata } from "next";

export const metadata : Metadata = { title: "Edit Transaction" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ orgId?: string }>
}) {
  const { id } = await params;
  const resolvedSearch = await searchParams;
  const organizations = await fetchOrgsOptionsFromCurrentUser();
  const orgId = resolvedSearch?.orgId ?? (() => {
    const fallback = organizations[0].org_id;
    console.log("No searchParam 'orgId' found. \nFalling back to: ", fallback)
    return fallback;
  })();
  const transaction = await fetchTransactionFromId(id);

  return (
    <main>
      <UpdateTransactionForm transaction={transaction} orgId={orgId} />
    </main>
  );
}
