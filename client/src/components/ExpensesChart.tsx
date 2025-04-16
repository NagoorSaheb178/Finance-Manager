import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@shared/schema";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface ExpensesChartProps {
  transactions: Transaction[];
  className?: string;
}

export default function ExpensesChart({ transactions, className }: ExpensesChartProps) {
  const [timeRange, setTimeRange] = useState<"3M" | "6M" | "1Y">("1Y");
  
  const chartData = useMemo(() => {
    // Get current date
    const now = new Date();
    
    // Determine how many months to go back based on time range
    const monthsToGoBack = timeRange === "3M" ? 3 : timeRange === "6M" ? 6 : 12;
    
    // Generate array of month ranges
    const monthRanges = Array.from({ length: monthsToGoBack }).map((_, index) => {
      const date = subMonths(now, index);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      return {
        month: format(date, 'MMM'),
        year: format(date, 'yyyy'),
        start,
        end,
      };
    }).reverse();
    
    // Calculate expenses for each month
    return monthRanges.map(range => {
      // Filter transactions for this month and exclude income
      const monthlyTransactions = transactions.filter(t => 
        !t.isIncome && 
        isWithinInterval(new Date(t.date), { 
          start: range.start, 
          end: range.end 
        })
      );
      
      // Sum up expenses
      const expenses = monthlyTransactions.reduce(
        (sum, t) => sum + Number(t.amount), 
        0
      );
      
      return {
        name: range.month,
        expenses: expenses,
        // Add tooltip display value
        tooltipValue: `$${expenses.toFixed(2)}`,
      };
    });
  }, [transactions, timeRange]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Monthly Expenses</CardTitle>
        <div className="flex">
          <div className="isolate inline-flex rounded-md shadow-sm">
            <Button
              onClick={() => setTimeRange("3M")}
              variant={timeRange === "3M" ? "primary" : "outline"}
              className="relative rounded-l-md py-1.5 px-3 text-sm"
            >
              3M
            </Button>
            <Button
              onClick={() => setTimeRange("6M")}
              variant={timeRange === "6M" ? "primary" : "outline"}
              className="relative -ml-px py-1.5 px-3 text-sm"
            >
              6M
            </Button>
            <Button
              onClick={() => setTimeRange("1Y")}
              variant={timeRange === "1Y" ? "primary" : "outline"}
              className="relative -ml-px rounded-r-md py-1.5 px-3 text-sm"
            >
              1Y
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Expenses']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar 
                dataKey="expenses" 
                fill="hsl(244.8 64.8% 66.9%)" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
