import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ExtendedProfileRow } from "@/types/supabase-extended";

export const useConsent = () => {
  return useQuery({
    queryKey: ["user-consent"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("data_processing_consent, data_processing_consent_at, terms_version, privacy_version")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const profile = data as unknown as ExtendedProfileRow;

      return {
        hasConsent: profile?.data_processing_consent || false,
        consentDate: profile?.data_processing_consent_at,
        termsVersion: profile?.terms_version,
        privacyVersion: profile?.privacy_version,
      };
    },
  });
};
