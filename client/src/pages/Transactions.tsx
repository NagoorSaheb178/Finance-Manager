import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusIcon, FilterIcon } from "lucide-react";
import TransactionTable from "@/components/TransactionTable";
import TransactionForm from "@/components/TransactionForm";
import { Transaction } from "@shared/schema";

export default function Transactions() {
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
    setTransactionModalOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-900">Transactions</h2>
        </div>
        <div>
          <Button 
            onClick={() => setTransactionModalOpen(true)} 
            className="inline-flex items-center"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Transaction
          </Button>
        </div>
      </header>

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">All Transactions</h3>
            <div>
              <Button variant="outline" className="inline-flex items-center">
                <FilterIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Filter
              </Button>
            </div>
          </div>
          
          <TransactionTable 
            transactions={transactions} 
            isLoading={isLoading}
            onEdit={handleEditTransaction}
          />
        </div>
      </div>

      <Dialog open={isTransactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <TransactionForm 
          transaction={editingTransaction} 
          onClose={handleCloseModal} 
        />
      </Dialog>
    </>
  );
}
