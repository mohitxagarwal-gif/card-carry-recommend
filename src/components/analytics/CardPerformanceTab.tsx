import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCardPerformance, useCategoryPerformance, useIssuerPerformance } from "@/hooks/useCardAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Heart, FileText, CreditCard, TrendingUp, MousePointerClick } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export const CardPerformanceTab = () => {
  const { data: cardPerformance, isLoading: cardsLoading } = useCardPerformance();
  const { data: categoryPerformance, isLoading: categoriesLoading } = useCategoryPerformance();
  const { data: issuerPerformance, isLoading: issuersLoading } = useIssuerPerformance();

  if (cardsLoading || categoriesLoading || issuersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Performing Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Card Performance</CardTitle>
          <CardDescription>Views, engagement, and conversion metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card</TableHead>
                  <TableHead className="text-right">
                    <Eye className="w-4 h-4 inline mr-1" />
                    Views
                  </TableHead>
                  <TableHead className="text-right">
                    <MousePointerClick className="w-4 h-4 inline mr-1" />
                    Clicks
                  </TableHead>
                  <TableHead className="text-right">
                    <Heart className="w-4 h-4 inline mr-1" />
                    Shortlisted
                  </TableHead>
                  <TableHead className="text-right">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Applications
                  </TableHead>
                  <TableHead className="text-right">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Conv. Rate
                  </TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cardPerformance?.slice(0, 15).map((card) => (
                  <TableRow key={card.cardId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{card.name}</div>
                        <div className="text-xs text-muted-foreground">{card.issuer}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{card.viewCount}</TableCell>
                    <TableCell className="text-right">{card.clickCount}</TableCell>
                    <TableCell className="text-right">{card.shortlistCount}</TableCell>
                    <TableCell className="text-right">{card.applicationCount}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={card.conversionRate >= 5 ? "default" : "secondary"}>
                        {card.conversionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={card.clickThroughRate >= 10 ? "default" : "secondary"}>
                        {card.clickThroughRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Engagement by card category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
              <Bar dataKey="shortlists" fill="hsl(var(--secondary))" name="Shortlisted" />
              <Bar dataKey="applications" fill="hsl(var(--accent))" name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Issuer Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Issuer Performance</CardTitle>
          <CardDescription>Applications by issuer</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issuerPerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {issuerPerformance?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
