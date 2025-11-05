import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { UsersTab } from "@/components/analytics/UsersTab";
import { CardsApplicationsTab } from "@/components/analytics/CardsApplicationsTab";
import { SpendingAnalysisTab } from "@/components/analytics/SpendingAnalysisTab";
import { ContentEngagementTab } from "@/components/analytics/ContentEngagementTab";
import { SystemActivityTab } from "@/components/analytics/SystemActivityTab";

const AdminAnalytics = () => {
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AnalyticsHeader />
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="cards" className="space-y-6">
          <CardsApplicationsTab />
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <SpendingAnalysisTab />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentEngagementTab />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
