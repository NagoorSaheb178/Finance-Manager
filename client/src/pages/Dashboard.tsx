import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SummaryCards from "@/components/SummaryCards";
import ExpensesChart from "@/components/ExpensesChart";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import TransactionTable from "@/components/TransactionTable";
import TransactionForm from "@/components/TransactionForm";
import { PlusIcon, BarChart4Icon } from "lucide-react";
import { Transaction } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const isMobile = useIsMobile();
  
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
        <div className="flex-1 flex">
          {isMobile && (
            <div className="lg:hidden mr-4">
              <Button variant="ghost" size="icon" className="p-2 text-gray-500">
                <BarChart4Icon className="h-5 w-5" />
              </Button>
            </div>
          )}
          <h2 className="text-lg font-medium text-gray-900">Dashboard</h2>
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
        <SummaryCards transactions={transactions} />
        
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ExpensesChart transactions={transactions} className="lg:col-span-2" />
          <CategoryBreakdown transactions={transactions} />
        </div>
        
        <div className="mt-6">
          <TransactionTable 
            transactions={transactions} 
            isLoading={isLoading}
            onEdit={handleEditTransaction}
            limit={5}
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
