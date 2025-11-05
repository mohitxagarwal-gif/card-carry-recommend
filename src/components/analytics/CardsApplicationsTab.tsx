import { useCardPerformance, useCategoryPerformance, useIssuerPerformance } from "@/hooks/useCardAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))", "#8b5cf6", "#f59e0b"];

export const CardsApplicationsTab = () => {
  const { data: cardPerformance, isLoading: cardsLoading } = useCardPerformance();
  const { data: categoryPerformance, isLoading: categoryLoading } = useCategoryPerformance();
  const { data: issuerPerformance, isLoading: issuerLoading } = useIssuerPerformance();

  if (cardsLoading || categoryLoading || issuerLoading) {
    return <Skeleton className="h-96" />;
  }

  const topCards = cardPerformance?.slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Top Cards Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Cards by Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Name</TableHead>
                <TableHead>Issuer</TableHead>
                <TableHead className="text-right">Annual Fee</TableHead>
                <TableHead className="text-right">Shortlisted</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Owned</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCards.map((card) => (
                <TableRow key={card.cardId}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>{card.issuer}</TableCell>
                  <TableCell className="text-right">₹{card.annualFee.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{card.shortlistCount}</TableCell>
                  <TableCell className="text-right">{card.applicationCount}</TableCell>
                  <TableCell className="text-right">{card.ownedCount}</TableCell>
                  <TableCell className="text-right">
                    {card.conversionRate > 0 ? (
                      <Badge variant="secondary">{card.conversionRate.toFixed(1)}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {topCards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No card activity yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category and Issuer Performance */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                shortlists: {
                  label: "Shortlists",
                  color: "hsl(var(--primary))",
                },
                applications: {
                  label: "Applications",
                  color: "hsl(var(--secondary))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="shortlists" fill="var(--color-shortlists)" />
                  <Bar dataKey="applications" fill="var(--color-applications)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Issuer Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Applications by Issuer</CardTitle>
          </CardHeader>
          <CardContent>
            {issuerPerformance && issuerPerformance.length > 0 ? (
              <ChartContainer
                config={{
                  value: {
                    label: "Applications",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issuerPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {issuerPerformance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No application data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
