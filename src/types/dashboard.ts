export interface RecommendationSnapshot {
  id: string;
  user_id: string;
  analysis_id: string | null;
  savings_min: number;
  savings_max: number;
  confidence: 'low' | 'medium' | 'high';
  recommended_cards: any[];
  created_at: string;
  updated_at: string;
}

export interface UserShortlist {
  id: string;
  user_id: string;
  card_id: string;
  added_at: string;
}

export interface CardApplication {
  id: string;
  user_id: string;
  card_id: string;
  status: 'considering' | 'applied' | 'approved' | 'rejected';
  applied_date: string | null;
  status_updated_at: string;
  notes: string | null;
  issuer_link: string | null;
  docs_checklist: any[];
  created_at: string;
  updated_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  opened_month: string | null;
  renewal_month: string | null;
  forex_pct: number | null;
  lounge_quota_total: number;
  lounge_used: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeWaiverGoal {
  id: string;
  user_id: string;
  card_id: string;
  target_amount: number;
  current_amount: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface UserReminder {
  id: string;
  user_id: string;
  card_id: string | null;
  reminder_type: 'bill_due' | 'annual_fee' | 'bonus_expiry' | 'lounge_reset';
  reminder_date: string;
  title: string;
  description: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface ContentFeed {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  url: string | null;
  target_income_bands: string[];
  target_categories: string[];
  is_evergreen: boolean;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  fee_sensitivity: 'low' | 'medium' | 'high' | null;
  travel_frequency: 'never' | 'occasional' | 'frequent' | null;
  lounge_importance: 'low' | 'medium' | 'high' | null;
  preference_type: 'cashback' | 'points' | 'both' | null;
  email_reminders: boolean;
  email_marketing: boolean;
  created_at: string;
  updated_at: string;
}
