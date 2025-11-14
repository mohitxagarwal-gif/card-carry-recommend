import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

      return {
        hasConsent: data?.data_processing_consent || false,
        consentDate: data?.data_processing_consent_at,
        termsVersion: data?.terms_version,
        privacyVersion: data?.privacy_version,
      };
    },
  });
};
