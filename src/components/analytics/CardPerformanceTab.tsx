import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCardPerformance, useCategoryPerformance, useIssuerPerformance } from "@/hooks/useCardAnalytics";
import { useAffiliatePerformance } from "@/hooks/useAffiliateAnalytics";
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
  const { data: affiliatePerformance, isLoading: affiliateLoading } = useAffiliatePerformance();

  if (cardsLoading || categoriesLoading || issuersLoading || affiliateLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Affiliate Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Affiliate Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliatePerformance?.totalClicks || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clicks (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{affiliatePerformance?.last30Days || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.round(affiliatePerformance?.topCards?.reduce((sum, c) => sum + (c.estimatedRevenue || 0), 0) || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Potential earnings</p>
          </CardContent>
        </Card>
      </div>

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
