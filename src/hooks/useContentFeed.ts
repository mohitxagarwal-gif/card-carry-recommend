import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

interface ContentFeed {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  url: string | null;
  target_income_bands: string[] | null;
  target_categories: string[] | null;
  is_evergreen: boolean | null;
  created_at: string;
}

export const useContentFeed = () => {
  const { data: content = [], isLoading } = useQuery({
    queryKey: ["content-feed"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let userIncomeBand: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("income_band_inr")
          .eq("id", user.id)
          .single();
        
        userIncomeBand = profile?.income_band_inr || null;
      }

      const { data, error } = await supabase
        .from("content_feed")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contentItems = data as ContentFeed[];
      
      // Sort: personalized first, then evergreen
      const sorted = contentItems.sort((a, b) => {
        const aPersonalized = userIncomeBand && 
          a.target_income_bands?.includes(userIncomeBand);
        const bPersonalized = userIncomeBand && 
          b.target_income_bands?.includes(userIncomeBand);
        
        if (aPersonalized && !bPersonalized) return -1;
        if (!aPersonalized && bPersonalized) return 1;
        
        // Both personalized or both not - sort by evergreen status
        if (a.is_evergreen && !b.is_evergreen) return 1;
        if (!a.is_evergreen && b.is_evergreen) return -1;
        
        return 0;
      });

      return sorted;
    },
  });

  const isPersonalized = (item: ContentFeed, userIncomeBand: string | null): boolean => {
    return !!(userIncomeBand && item.target_income_bands?.includes(userIncomeBand));
  };

  const trackContentClick = (itemId: string, title: string) => {
    trackEvent("content_click", { itemId, title });
  };

  return {
    content,
    isLoading,
    isPersonalized,
    trackContentClick,
  };
};
