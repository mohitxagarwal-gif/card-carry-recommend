import { useAnalysisActivity, useSpendingCategories } from "@/hooks/useSystemMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const SpendingAnalysisTab = () => {
  const { data: analysisActivity, isLoading: activityLoading } = useAnalysisActivity();
  const { data: spendingCategories, isLoading: categoriesLoading } = useSpendingCategories();

  if (activityLoading || categoriesLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Analysis Activity Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Activity Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: {
                label: "Total Analyses",
                color: "hsl(var(--primary))",
              },
              ai: {
                label: "AI-Powered",
                color: "hsl(var(--secondary))",
              },
              manual: {
                label: "Manual",
                color: "hsl(var(--accent))",
              },
            }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysisActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} />
                <Line type="monotone" dataKey="ai" stroke="var(--color-ai)" strokeWidth={2} />
                <Line type="monotone" dataKey="manual" stroke="var(--color-manual)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Spending Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Spending Categories (Aggregated)</CardTitle>
        </CardHeader>
        <CardContent>
          {spendingCategories && spendingCategories.length > 0 ? (
            <ChartContainer
              config={{
                value: {
                  label: "Amount (₹)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingCategories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => `₹${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">No spending data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisActivity?.reduce((sum, day) => sum + day.total, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">AI-Powered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisActivity?.reduce((sum, day) => sum + day.ai, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Using AI extraction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisActivity?.reduce((sum, day) => sum + day.manual, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Manual extraction</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
