import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeTrackEvent as trackEvent } from "@/lib/safeAnalytics";

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
  const queryClient = useQueryClient();

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

  const addContent = useMutation({
    mutationFn: async (content: Omit<ContentFeed, "id" | "created_at">) => {
      const { error } = await supabase
        .from("content_feed")
        .insert(content);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-feed"] });
      toast.success("Article added successfully");
    },
    onError: () => {
      toast.error("Failed to add article");
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentFeed> }) => {
      const { error } = await supabase
        .from("content_feed")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-feed"] });
      toast.success("Article updated successfully");
    },
    onError: () => {
      toast.error("Failed to update article");
    },
  });

  const deleteContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_feed")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-feed"] });
      toast.success("Article deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete article");
    },
  });

  return {
    content,
    isLoading,
    isPersonalized,
    trackContentClick,
    addContent: addContent.mutate,
    updateContent: updateContent.mutate,
    deleteContent: deleteContent.mutate,
  };
};
