import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

interface SpendingInsightsPanelProps {
  analysisData: any;
  snapshot: any;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const SpendingInsightsPanel = ({ analysisData, snapshot }: SpendingInsightsPanelProps) => {
  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-heading">Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-sans text-sm">
            No spending data available. Upload statements to see insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categories = analysisData.categories || analysisData.topCategories || [];
  const totalSpending = analysisData.totalSpending || 0;

  const chartData = categories.slice(0, 5).map((cat: any) => ({
    name: cat.name,
    value: cat.amount,
    percentage: cat.percentage || ((cat.amount / totalSpending) * 100)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-heading flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-sans">Total Monthly Spend</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              ₹{totalSpending.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-sans">Top Category</p>
            <p className="text-2xl font-heading font-bold text-foreground">
              {categories[0]?.name || 'N/A'}
            </p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `₹${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground font-sans">Category Breakdown</p>
          {categories.slice(0, 5).map((cat: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-foreground font-sans">{cat.name}</span>
              </div>
              <span className="text-muted-foreground font-sans">
                ₹{cat.amount.toLocaleString()} ({(cat.percentage || ((cat.amount / totalSpending) * 100)).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
