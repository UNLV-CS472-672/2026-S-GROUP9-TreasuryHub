import { CreateTransactionForm } from "@/app/transaction/ui/form";

export const metadata = { title: "New Transaction" };

export default function Page() {
  return (
    <main>
      <CreateTransactionForm />
    </main>
  );
}
