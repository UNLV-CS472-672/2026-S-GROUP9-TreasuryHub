import TransactionTable from "@/app/transaction/ui/table";
import { CreateTransaction } from "@/app/transaction/ui/buttons";

export default function page(){
  // TODO: Restrict display to only user_org
  // TODO: Add layout page
  // TODO: Add color and formatting

  return (
    <main>
        <h1>
          Transaction
        </h1>
      <CreateTransaction />
      <TransactionTable />
    </main>
  );
}
