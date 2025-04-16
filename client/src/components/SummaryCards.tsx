import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Transaction } from "@shared/schema";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator 
} from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";

interface SummaryCardsProps {
  transactions: Transaction[];
}

export default function SummaryCards({ transactions }: SummaryCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter for current month transactions
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Calculate totals
    const totalBalance = transactions.reduce((sum, t) => 
      t.isIncome ? sum + Number(t.amount) : sum - Number(t.amount), 0);
    
    const income = currentMonthTransactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = currentMonthTransactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Assume a fixed budget for demonstration
    const monthlyBudget = 2500;
    const budgetUsedPercentage = monthlyBudget > 0 
      ? Math.round((expenses / monthlyBudget) * 100) 
      : 0;
    
    return {
      totalBalance,
      income,
      expenses,
      monthlyBudget,
      budgetUsedPercentage
    };
  }, [transactions]);

  const currentMonthName = format(new Date(), 'MMMM');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Balance */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                <dd className="text-2xl font-semibold text-gray-900 tabular-nums">
                  ${stats.totalBalance.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/90">View details</a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Income */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-secondary/10 p-3">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Income ({currentMonthName})
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 tabular-nums">
                  ${stats.income.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/90">View details</a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Expenses */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-destructive/10 p-3">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Expenses ({currentMonthName})
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 tabular-nums">
                  ${stats.expenses.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/90">View details</a>
          </div>
        </CardFooter>
      </Card>
      
      {/* Budget */}
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-accent/10 p-3">
              <Calculator className="h-6 w-6 text-accent" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Monthly Budget</dt>
                <dd className="flex items-baseline">
                  <span className="text-2xl font-semibold text-gray-900 tabular-nums">
                    ${stats.monthlyBudget.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm font-medium text-destructive">
                    {stats.budgetUsedPercentage}%
                  </span>
                </dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/90">Manage budget</a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
