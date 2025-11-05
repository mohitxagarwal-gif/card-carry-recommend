import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const ContentEngagementTab = () => {
  const { data: contentStats, isLoading: contentLoading } = useQuery({
    queryKey: ["analytics", "content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_feed")
        .select("*");

      if (error) throw error;

      const evergreen = data.filter(c => c.is_evergreen).length;
      const timely = data.filter(c => !c.is_evergreen).length;

      // Tag distribution
      const tagMap = new Map<string, number>();
      data.forEach(content => {
        if (content.tag) {
          tagMap.set(content.tag, (tagMap.get(content.tag) || 0) + 1);
        }
      });

      // Category targeting
      const categorySet = new Set<string>();
      data.forEach(content => {
        content.target_categories?.forEach((cat: string) => categorySet.add(cat));
      });

      // Income band targeting
      const incomeSet = new Set<string>();
      data.forEach(content => {
        content.target_income_bands?.forEach((band: string) => incomeSet.add(band));
      });

      return {
        total: data.length,
        evergreen,
        timely,
        tags: Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count })),
        categoryCoverage: categorySet.size,
        incomeCoverage: incomeSet.size,
        recentContent: data.slice(0, 10),
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: preferenceStats, isLoading: preferencesLoading } = useQuery({
    queryKey: ["analytics", "user-preferences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*");

      if (error) throw error;

      const emailReminders = data.filter(p => p.email_reminders).length;
      const emailMarketing = data.filter(p => p.email_marketing).length;

      // Travel frequency
      const travelMap = new Map<string, number>();
      data.forEach(pref => {
        if (pref.travel_frequency) {
          travelMap.set(pref.travel_frequency, (travelMap.get(pref.travel_frequency) || 0) + 1);
        }
      });

      // Lounge importance
      const loungeMap = new Map<string, number>();
      data.forEach(pref => {
        if (pref.lounge_importance) {
          loungeMap.set(pref.lounge_importance, (loungeMap.get(pref.lounge_importance) || 0) + 1);
        }
      });

      return {
        total: data.length,
        emailRemindersRate: data.length > 0 ? (emailReminders / data.length) * 100 : 0,
        emailMarketingRate: data.length > 0 ? (emailMarketing / data.length) * 100 : 0,
        travelFrequency: Array.from(travelMap.entries()).map(([freq, count]) => ({ freq, count })),
        loungeImportance: Array.from(loungeMap.entries()).map(([importance, count]) => ({ importance, count })),
      };
    },
    staleTime: 2 * 60 * 1000,
  });

  if (contentLoading || preferencesLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Content Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Evergreen Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.evergreen || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Category Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.categoryCoverage || 0}</div>
            <p className="text-xs text-muted-foreground">Unique categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Income Band Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats?.incomeCoverage || 0}</div>
            <p className="text-xs text-muted-foreground">Unique income bands</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content by Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {contentStats?.tags.map(({ tag, count }) => (
              <Badge key={tag} variant="secondary">
                {tag} ({count})
              </Badge>
            ))}
            {contentStats?.tags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Preferences */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Email Reminders</span>
                  <span className="text-sm font-medium">{preferenceStats?.emailRemindersRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${preferenceStats?.emailRemindersRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Email Marketing</span>
                  <span className="text-sm font-medium">{preferenceStats?.emailMarketingRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${preferenceStats?.emailMarketingRate}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Travel Frequency</h4>
                {preferenceStats?.travelFrequency.map(({ freq, count }) => (
                  <div key={freq} className="flex justify-between text-sm mb-1">
                    <span>{freq}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Lounge Importance</h4>
                {preferenceStats?.loungeImportance.map(({ importance, count }) => (
                  <div key={importance} className="flex justify-between text-sm mb-1">
                    <span>{importance}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
