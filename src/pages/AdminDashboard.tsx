import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCards } from "@/hooks/useCards";
import { useContentFeed } from "@/hooks/useContentFeed";
import { Loader2, CreditCard, FileText, Edit, Grid, BarChart, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { AdminModuleCard } from "@/components/admin/AdminModuleCard";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: cards, isLoading: cardsLoading } = useCards();
  const { content, isLoading: contentLoading } = useContentFeed();

  const { data: userCount } = useQuery({
    queryKey: ["admin-user-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to access admin panel");
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!roleLoading && role !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [role, roleLoading, navigate]);

  if (roleLoading || cardsLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeCards = cards?.filter(card => card.is_active).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the admin control panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminStatsCard
            title="Active Cards"
            value={activeCards}
            icon={CreditCard}
            description="Total credit cards in database"
          />
          <AdminStatsCard
            title="Content Articles"
            value={content?.length || 0}
            icon={FileText}
            description="Recommended reading posts"
          />
          <AdminStatsCard
            title="Total Users"
            value={userCount || 0}
            icon={Users}
            description="Registered user accounts"
          />
          <AdminStatsCard
            title="Categories"
            value={12}
            icon={Grid}
            description="Active spending categories"
          />
        </div>

        {/* Module Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Management Modules</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AdminModuleCard
              title="Credit Cards"
              description="Manage credit card database, add new cards, and update existing ones"
              icon={CreditCard}
              href="/admin/cards"
            />
            <AdminModuleCard
              title="Content Feed"
              description="Manage recommended reading articles and personalized content"
              icon={FileText}
              href="/admin/content"
            />
            <AdminModuleCard
              title="Site Content"
              description="Edit hero sections, FAQ, How It Works, and other site text"
              icon={Edit}
              href="/admin/site-content"
            />
            <AdminModuleCard
              title="Categories"
              description="Manage spending categories, icons, and display order"
              icon={Grid}
              href="/admin/categories"
            />
            <AdminModuleCard
              title="Analytics"
              description="View user engagement, popular cards, and content performance"
              icon={BarChart}
              href="/admin/analytics"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
