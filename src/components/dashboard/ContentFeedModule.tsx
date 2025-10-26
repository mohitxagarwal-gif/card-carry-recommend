import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Sparkles } from "lucide-react";
import { useContentFeed } from "@/hooks/useContentFeed";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ContentFeedModule = () => {
  const { content, isLoading, isPersonalized, trackContentClick } = useContentFeed();

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile-income"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("income_band_inr")
        .eq("id", user.id)
        .single();

      return data;
    },
  });

  const displayContent = content.slice(0, 5);

  const handleContentClick = (itemId: string, title: string, url: string | null) => {
    if (url) {
      trackContentClick(itemId, title);
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-playfair">Recommended Reading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">Loading content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-playfair">Recommended Reading</CardTitle>
      </CardHeader>
      <CardContent>
        {displayContent.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No content available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayContent.map((item) => {
              const personalized = isPersonalized(item, userProfile?.income_band_inr || null);
              return (
                <button
                  key={item.id}
                  onClick={() => handleContentClick(item.id, item.title, item.url)}
                  className="w-full text-left p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {personalized && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            For you
                          </Badge>
                        )}
                        {item.tag && (
                          <Badge variant="outline" className="text-xs">
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <div className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
