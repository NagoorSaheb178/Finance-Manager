import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { 
  HomeIcon, 
  UtensilsCrossedIcon, 
  CarIcon, 
  PlayCircleIcon, 
  BoltIcon, 
  DollarSign,
  PackageIcon
} from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
  limit?: number;
}

export default function TransactionTable({ 
  transactions, 
  isLoading, 
  onEdit,
  limit 
}: TransactionTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredTransactions = limit 
    ? transactions.slice(0, limit) 
    : transactions;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete transaction: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Housing":
        return <HomeIcon className="h-4 w-4 text-primary" />;
      case "Food & Dining":
        return <UtensilsCrossedIcon className="h-4 w-4 text-accent" />;
      case "Transportation":
        return <CarIcon className="h-4 w-4 text-secondary" />;
      case "Entertainment":
        return <PlayCircleIcon className="h-4 w-4 text-destructive" />;
      case "Utilities":
        return <BoltIcon className="h-4 w-4 text-purple-500" />;
      case "Income":
        return <DollarSign className="h-4 w-4 text-secondary" />;
      default:
        return <PackageIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Category style mapping
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Housing":
        return "bg-primary/10 text-primary";
      case "Food & Dining":
        return "bg-accent/10 text-accent";
      case "Transportation":
        return "bg-secondary/10 text-secondary";
      case "Entertainment":
        return "bg-destructive/10 text-destructive";
      case "Utilities":
        return "bg-purple-100 text-purple-800";
      case "Income":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.notes}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryStyle(transaction.category)}`}>
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right tabular-nums ${
                    transaction.isIncome ? 'text-secondary' : 'text-destructive'
                  }`}>
                    {transaction.isIncome ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80 mr-3"
                      onClick={() => onEdit(transaction)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-gray-400 hover:text-destructive"
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Simple pagination for demonstration */}
      {!limit && transactions.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{Math.min(transactions.length, 10)}</span> of{" "}
                <span className="font-medium">{transactions.length}</span> transactions
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                  disabled
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                  disabled
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
