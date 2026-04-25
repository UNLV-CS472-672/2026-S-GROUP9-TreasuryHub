import { CreateTransactionForm } from "@/app/transaction/ui/form";
import { fetchOrgsOptionsFromCurrentUser } from "../lib/data";
import { Metadata } from "next";

export const metadata : Metadata = { title: "New Transaction" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string }>
}) {
  const params = await searchParams;
  const organizations = await fetchOrgsOptionsFromCurrentUser();
  const orgId = params?.orgId ?? (() => {
    const fallback = organizations[0].org_id;
    console.log("No searchParam 'orgId' found. \nFalling back to: ", fallback)
    return fallback;
  })();

  return (
    <main>
      <CreateTransactionForm orgId={orgId} />
    </main>
  );
}
