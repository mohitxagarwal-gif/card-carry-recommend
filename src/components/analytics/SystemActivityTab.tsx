import { useTableStatistics } from "@/hooks/useSystemMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const SystemActivityTab = () => {
  const { data: tableStats, isLoading } = useTableStatistics();

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  const getTrend = (rows7d: number, rows30d: number) => {
    if (rows7d === 0 && rows30d === 0) return "stable";
    if (rows7d > rows30d / 4) return "up"; // More than weekly average
    if (rows7d < rows30d / 8) return "down"; // Less than half weekly average
    return "stable";
  };

  return (
    <div className="space-y-6">
      {/* Database Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Database Tables Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead className="text-right">Total Rows</TableHead>
                <TableHead className="text-right">Last 7 Days</TableHead>
                <TableHead className="text-right">Last 30 Days</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableStats?.map((stat) => {
                const trend = getTrend(stat.rows7d, stat.rows30d);
                return (
                  <TableRow key={stat.tableName}>
                    <TableCell className="font-mono text-sm">{stat.tableName}</TableCell>
                    <TableCell className="text-right font-medium">{stat.totalRows.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {stat.rows7d > 0 ? (
                        <Badge variant="secondary">+{stat.rows7d}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {stat.rows30d > 0 ? (
                        <Badge variant="secondary">+{stat.rows30d}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stat.lastUpdated
                        ? formatDistanceToNow(new Date(stat.lastUpdated), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                      {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tableStats?.reduce((sum, stat) => sum + stat.totalRows, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New Records (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tableStats?.reduce((sum, stat) => sum + stat.rows7d, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New Records (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tableStats?.reduce((sum, stat) => sum + stat.rows30d, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
