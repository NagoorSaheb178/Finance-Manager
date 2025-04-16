import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, categories } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function Categories() {
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const categoryColors = {
    "Housing": "#6366F1", // primary
    "Food & Dining": "#F59E0B", // amber
    "Transportation": "#10B981", // green
    "Entertainment": "#EF4444", // red
    "Utilities": "#8B5CF6", // purple
    "Income": "#22C55E", // green
    "Other": "#94A3B8", // gray
  };

  // Calculate totals by category (excluding income)
  const categoryTotals = transactions
    .filter(t => !t.isIncome)
    .reduce((acc, transaction) => {
      const category = transaction.category;
      acc[category] = (acc[category] || 0) + Number(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

  // Calculate total expenses
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

  // Format data for pie chart
  const pieChartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: Math.round((amount / totalExpenses) * 100),
  }));

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-900">Categories</h2>
        </div>
      </header>

      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={categoryColors[entry.name as keyof typeof categoryColors]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories
                  .filter(category => category !== 'Income')
                  .map(category => {
                    const amount = categoryTotals[category] || 0;
                    const percentage = totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: categoryColors[category as keyof typeof categoryColors] }}
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900 tabular-nums">
                            ${amount.toFixed(2)}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
