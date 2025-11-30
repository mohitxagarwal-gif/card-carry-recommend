import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/authUtils";

interface AuthSessionData {
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
}

/**
 * Cached auth session hook
 * Uses React Query to cache auth state for 5 minutes
 * Eliminates redundant auth checks on navigation
 */
export const useAuthSession = () => {
  return useQuery<AuthSessionData>({
    queryKey: ["auth-session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          session: null,
          profile: null,
          isAuthenticated: false,
        };
      }

      // Fetch profile once
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, age_range, income_band_inr, phone_e164, city, onboarding_completed")
        .eq("id", session.user.id)
        .single();

      return {
        session,
        profile: profile as Profile,
        isAuthenticated: true,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent race conditions during fast navigation
    retry: 1,
  });
};
