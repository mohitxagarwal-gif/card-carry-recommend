import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SiteContent {
  id: string;
  section: string;
  content: any;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export const useSiteContent = (section?: string) => {
  const queryClient = useQueryClient();

  const { data: siteContent, isLoading } = useQuery({
    queryKey: section ? ["site-content", section] : ["site-content"],
    queryFn: async () => {
      if (section) {
        const { data, error } = await supabase
          .from("site_content")
          .select("*")
          .eq("section", section)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data as SiteContent | null;
      } else {
        const { data, error } = await supabase
          .from("site_content")
          .select("*");
        
        if (error) throw error;
        return data as SiteContent[];
      }
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({ section, content }: { section: string; content: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("site_content")
        .update({ 
          content,
          updated_by: user.id
        })
        .eq("section", section);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Content updated successfully");
    },
    onError: () => {
      toast.error("Failed to update content");
    },
  });

  return {
    siteContent,
    isLoading,
    updateContent: updateContent.mutate,
  };
};
