import TransactionTable from "@/app/transaction/ui/table";
import CreateTransaction from "@/app/transaction/ui/button";

export default function page(){
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
