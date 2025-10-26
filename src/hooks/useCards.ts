import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreditCard {
  id: string;
  card_id: string;
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  waiver_rule?: string;
  welcome_bonus: string;
  reward_type: string[];
  reward_structure: string;
  key_perks: string[];
  lounge_access: string;
  forex_markup: string;
  forex_markup_pct: number;
  ideal_for: string[];
  downsides: string[];
  category_badges: string[];
  image_url?: string;
  eligibility?: string;
  docs_required?: string;
  tnc_url?: string;
  popular_score: number;
  is_active: boolean;
}

export const useCards = () => {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_cards")
        .select("*")
        .eq("is_active", true)
        .order("popular_score", { ascending: false });

      if (error) throw error;
      return data as CreditCard[];
    },
  });
};
