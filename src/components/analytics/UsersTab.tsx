import { useUserDemographics, useUserActivity } from "@/hooks/useUserAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export const UsersTab = () => {
  const { data: demographics, isLoading: demoLoading } = useUserDemographics();
  const { data: activity, isLoading: activityLoading } = useUserActivity();

  if (demoLoading || activityLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Demographics Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Users",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographics?.ageDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {demographics?.ageDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Income Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Users",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographics?.incomeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {demographics?.cityDistribution.map((city, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{city.name}</span>
                  <Badge variant="secondary">{city.value}</Badge>
                </div>
              ))}
              {demographics?.cityDistribution.length === 0 && (
                <p className="text-sm text-muted-foreground">No city data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Consent Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marketing Consent Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{demographics?.marketingConsentRate.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground mt-1">
            Users who opted in for marketing communications
          </p>
        </CardContent>
      </Card>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Onboarded</TableHead>
                <TableHead className="text-right">Analyses</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Shortlisted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(user.joinDate), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {user.onboardingCompleted ? (
                      <Badge variant="default" className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{user.analysesCount}</TableCell>
                  <TableCell className="text-right">{user.applicationsCount}</TableCell>
                  <TableCell className="text-right">{user.shortlistedCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
