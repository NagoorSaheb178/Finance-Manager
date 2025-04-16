import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function Reports() {
  const [reportType, setReportType] = useState<string>("monthly");
  
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Monthly spending over time (line chart data)
  const monthlyTrends = (() => {
    const now = new Date();
    const monthsToShow = 12;
    
    const monthRanges = Array.from({ length: monthsToShow }).map((_, index) => {
      const date = subMonths(now, index);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      return {
        month: format(date, 'MMM yyyy'),
        start,
        end,
      };
    }).reverse();
    
    return monthRanges.map(range => {
      // Filter transactions for this month
      const monthlyExpenseTransactions = transactions.filter(t => 
        !t.isIncome && 
        isWithinInterval(new Date(t.date), { 
          start: range.start, 
          end: range.end 
        })
      );
      
      const monthlyIncomeTransactions = transactions.filter(t => 
        t.isIncome && 
        isWithinInterval(new Date(t.date), { 
          start: range.start, 
          end: range.end 
        })
      );
      
      // Sum up expenses and income
      const expenses = monthlyExpenseTransactions.reduce(
        (sum, t) => sum + Number(t.amount), 
        0
      );
      
      const income = monthlyIncomeTransactions.reduce(
        (sum, t) => sum + Number(t.amount), 
        0
      );
      
      // Calculate savings (income - expenses)
      const savings = income - expenses;
      
      return {
        name: range.month,
        expenses: expenses,
        income: income,
        savings: savings
      };
    });
  })();

  // Category comparison (bar chart data)
  const categoryComparison = (() => {
    // Group expenses by category
    const expensesByCategory = transactions
      .filter(t => !t.isIncome)
      .reduce((acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    // Convert to array and sort by amount
    return Object.entries(expensesByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();

  // Income vs Expenses (pie chart data)
  const incomeVsExpenses = (() => {
    const totalIncome = transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return [
      { name: 'Income', value: totalIncome },
      { name: 'Expenses', value: totalExpenses }
    ];
  })();

  const renderReport = () => {
    switch (reportType) {
      case "monthly":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '`']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      activeDot={{ r: 8 }} 
                      name="Income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      name="Expenses"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="savings" 
                      stroke="#6366F1" 
                      strokeWidth={2} 
                      name="Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      
      case "category":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryComparison}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 60, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      width={80}
                    />
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(244.8 64.8% 66.9%)" 
                      radius={[0, 4, 4, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
        
      case "income":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeVsExpenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: $${value.toFixed(2)} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#10B981" /> {/* Income */}
                      <Cell fill="#EF4444" /> {/* Expenses */}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  Total Income: <span className="font-semibold text-green-600">${incomeVsExpenses[0].value.toFixed(2)}</span>
                </p>
                <p className="text-gray-600">
                  Total Expenses: <span className="font-semibold text-red-600">${incomeVsExpenses[1].value.toFixed(2)}</span>
                </p>
                <p className="text-gray-600 mt-2">
                  Net Balance: <span className={`font-semibold ${(incomeVsExpenses[0].value - incomeVsExpenses[1].value) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(incomeVsExpenses[0].value - incomeVsExpenses[1].value).toFixed(2)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-900">Reports</h2>
        </div>
        <div className="w-48">
          <Select
            value={reportType}
            onValueChange={(value) => setReportType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Trends</SelectItem>
              <SelectItem value="category">Category Breakdown</SelectItem>
              <SelectItem value="income">Income vs Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-gray-500">
            {reportType === "monthly" && "View your financial trends over time, including income, expenses, and savings."}
            {reportType === "category" && "Compare spending across different categories to identify your biggest expenses."}
            {reportType === "income" && "Compare your total income and expenses to understand your overall financial health."}
          </p>
        </div>
        
        {renderReport()}
      </div>
    </>
  );
}