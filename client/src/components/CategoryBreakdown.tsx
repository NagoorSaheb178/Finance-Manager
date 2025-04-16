import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@shared/schema";

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

export default function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const { pieData, categoryData, totalExpenses } = useMemo(() => {
    // Only include expense transactions (not income)
    const expenseTransactions = transactions.filter(t => !t.isIncome);
    
    // Group transactions by category
    const categoryTotals = expenseTransactions.reduce((acc, t) => {
      const category = t.category;
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate total expenses
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    // Prepare data for pie chart
    const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0
    }));
    
    // Prepare data for category list - sort by amount descending
    const categoryData = [...pieData].sort((a, b) => b.value - a.value);
    
    return { pieData, categoryData, totalExpenses };
  }, [transactions]);

  // Category colors
  const categoryColors = {
    "Housing": "#6366F1", // primary
    "Food & Dining": "#F59E0B", // amber
    "Transportation": "#10B981", // green
    "Entertainment": "#EF4444", // red
    "Utilities": "#8B5CF6", // purple
    "Income": "#22C55E", // green
    "Other": "#94A3B8", // gray
  };

  // Fallback color for unknown categories
  const getColor = (category: string) => 
    categoryColors[category as keyof typeof categoryColors] || "#94A3B8";

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="p-6 border-b border-gray-200">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Donut chart */}
        <div className="h-60 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.name)} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category Legend */}
        <div className="mt-6 space-y-3">
          {categoryData.map((category) => (
            <div key={category.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: getColor(category.name) }}
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900 tabular-nums">
                  ${category.value.toFixed(2)}
                </span>
                <span className="ml-1 text-xs text-gray-500">{category.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
        
        {categoryData.length === 0 && (
          <div className="mt-6 text-center text-gray-500">
            No expense data available
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <a href="/categories" className="text-sm font-medium text-primary hover:text-primary/90">
            View all categories
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
