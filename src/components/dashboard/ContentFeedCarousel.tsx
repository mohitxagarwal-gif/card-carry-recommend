import { useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContentFeed } from "@/hooks/useContentFeed";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ContentFeedCarousel = () => {
  const { content, isLoading, trackContentClick } = useContentFeed();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  const isPersonalized = (item: typeof content[0]): boolean => {
    return !!(userProfile?.income_band_inr && 
      item.target_income_bands?.includes(userProfile.income_band_inr));
  };

  const handleContentClick = (item: typeof content[0]) => {
    trackContentClick(item.id, item.title);
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  // Auto-rotate carousel
  useEffect(() => {
    if (!api || displayContent.length === 0) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api, displayContent.length]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  if (isLoading || displayContent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            recommended reading
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollPrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollNext}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {displayContent.map((item) => (
              <CarouselItem key={item.id}>
                <div
                  className="group cursor-pointer p-4 rounded-lg border border-hairline bg-card hover:bg-accent/50 transition-colors"
                  onClick={() => handleContentClick(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPersonalized(item) && (
                          <Badge variant="secondary" className="text-xs">
                            for you
                          </Badge>
                        )}
                        {item.tag && (
                          <Badge variant="outline" className="text-xs">
                            {item.tag}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-subtle line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {displayContent.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
