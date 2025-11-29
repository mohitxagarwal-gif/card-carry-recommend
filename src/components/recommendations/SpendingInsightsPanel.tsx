import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, DollarSign } from "lucide-react";

interface SpendingInsightsPanelProps {
  analysisData: any;
  snapshot: any;
  userFeatures?: any; // Fallback for manual flows
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const SpendingInsightsPanel = ({ analysisData, snapshot, userFeatures }: SpendingInsightsPanelProps) => {
  // Build data from analysisData OR userFeatures
  let categories: any[] = [];
  let totalSpending = 0;
  let dataSource = 'unknown';

  if (analysisData) {
    // Statement-based flow
    categories = analysisData.categories || analysisData.topCategories || [];
    totalSpending = analysisData.totalSpending || 0;
    dataSource = 'statements';
  } else if (userFeatures) {
    // Manual flow - reconstruct from user_features
    const monthlySpend = userFeatures.monthly_spend_estimate || 0;
    totalSpending = monthlySpend;
    dataSource = snapshot?.snapshot_type || 'manual';

    // Build categories from spend shares
    const categoryMapping: Record<string, { key: string; name: string }> = {
      online_share: { key: 'online_share', name: 'Online' },
      dining_share: { key: 'dining_share', name: 'Dining' },
      groceries_share: { key: 'groceries_share', name: 'Groceries' },
      travel_share: { key: 'travel_share', name: 'Travel' },
      entertainment_share: { key: 'entertainment_share', name: 'Entertainment' },
      bills_utilities_share: { key: 'bills_utilities_share', name: 'Bills & Utilities' },
      cabs_fuel_share: { key: 'cabs_fuel_share', name: 'Fuel' },
    };

    categories = Object.entries(categoryMapping)
      .map(([key, { name }]) => {
        const share = userFeatures[key] || 0;
        const amount = monthlySpend * share;
        return {
          name,
          amount: Math.round(amount),
          percentage: Math.round(share * 100)
        };
      })
      .filter(cat => cat.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  if (categories.length === 0 && totalSpending === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-heading">Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-sans text-sm">
            No spending data available. Upload statements or complete onboarding to see insights.
          </p>
        </CardContent>
      </Card>
    );
  }

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
          {dataSource !== 'statements' && (
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (based on your estimates)
            </span>
          )}
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
