import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, MapPin, Wallet, FileText, Star, CreditCard, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserSummaryCardProps {
  userId: string;
}

export default function UserSummaryCard({ userId }: UserSummaryCardProps) {
  const { data: userData, isLoading } = useQuery({
    queryKey: ["user-summary", userId],
    queryFn: async () => {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Fetch stats
      const [
        { count: analysisCount },
        { count: snapshotCount },
        { count: cardsCount },
        { count: applicationsCount }
      ] = await Promise.all([
        supabase.from("spending_analyses").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("recommendation_snapshots").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("user_cards").select("*", { count: 'exact', head: true }).eq("user_id", userId),
        supabase.from("card_applications").select("*", { count: 'exact', head: true }).eq("user_id", userId)
      ]);

      return {
        profile,
        stats: {
          analyses: analysisCount || 0,
          snapshots: snapshotCount || 0,
          cards: cardsCount || 0,
          applications: applicationsCount || 0
        }
      };
    }
  });

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!userData?.profile) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">User data not found</p>
      </Card>
    );
  }

  const { profile, stats } = userData;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.full_name || 'Unnamed User'}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{profile.email}</span>
              </div>
            </div>
          </div>
          {profile.data_processing_consent && (
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              Consented
            </Badge>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {profile.city && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{profile.city}</span>
          </div>
        )}
        {profile.income_band_inr && (
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{profile.income_band_inr}</span>
          </div>
        )}
        {profile.age_range && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{profile.age_range} years</span>
          </div>
        )}
        {profile.employment_type && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{profile.employment_type}</Badge>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-muted rounded-lg">
          <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">{stats.analyses}</div>
          <div className="text-xs text-muted-foreground">Analyses</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <Star className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">{stats.snapshots}</div>
          <div className="text-xs text-muted-foreground">Recommendations</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <CreditCard className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">{stats.cards}</div>
          <div className="text-xs text-muted-foreground">Cards Owned</div>
        </div>
        <div className="text-center p-4 bg-muted rounded-lg">
          <CheckCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <div className="text-2xl font-bold">{stats.applications}</div>
          <div className="text-xs text-muted-foreground">Applications</div>
        </div>
      </div>
    </Card>
  );
}
