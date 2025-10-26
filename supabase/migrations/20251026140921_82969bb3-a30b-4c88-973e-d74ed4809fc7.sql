-- Seed content_feed table with sample content

INSERT INTO public.content_feed (title, description, tag, url, target_income_bands, target_categories, is_evergreen) VALUES
  (
    'Best Dining Cards for Mid-Income Earners',
    'Discover credit cards that maximize rewards on dining and food delivery for those earning ₹50k-₹1L monthly.',
    'Dining',
    'https://example.com/dining-cards-mid-income',
    ARRAY['₹50k-₹1L']::text[],
    ARRAY['dining']::text[],
    false
  ),
  (
    'How to Hit Fee Waivers Smartly',
    'Practical strategies to meet spending requirements and waive annual fees on premium credit cards.',
    'Tips',
    'https://example.com/fee-waiver-strategies',
    ARRAY[]::text[],
    ARRAY[]::text[],
    true
  ),
  (
    'Low Forex Cards for Frequent Travelers',
    'Compare cards with minimal foreign transaction fees for those earning ₹1L-₹2L and traveling regularly.',
    'Travel',
    'https://example.com/low-forex-travel-cards',
    ARRAY['₹1L-₹2L']::text[],
    ARRAY['travel']::text[],
    false
  ),
  (
    'Premium Cards: Are They Worth It?',
    'An honest analysis of whether premium credit cards justify their high annual fees for high earners.',
    'Premium',
    'https://example.com/premium-cards-analysis',
    ARRAY['₹2L+']::text[],
    ARRAY[]::text[],
    false
  ),
  (
    'Maximizing Cashback on Daily Spends',
    'Tips and tricks to get the most cashback from groceries, fuel, and utility bill payments.',
    'Cashback',
    'https://example.com/maximize-cashback',
    ARRAY[]::text[],
    ARRAY['groceries', 'fuel']::text[],
    true
  ),
  (
    'Airport Lounge Access Guide 2025',
    'Complete guide to maximizing airport lounge benefits across different credit card tiers.',
    'Travel',
    'https://example.com/lounge-access-guide',
    ARRAY[]::text[],
    ARRAY['travel']::text[],
    true
  ),
  (
    'Credit Score Impact: What You Need to Know',
    'Understanding how credit card usage affects your CIBIL score and how to maintain a healthy credit profile.',
    'Credit Score',
    'https://example.com/credit-score-guide',
    ARRAY[]::text[],
    ARRAY[]::text[],
    true
  ),
  (
    'Reward Points: Earn and Burn Strategies',
    'How to accumulate reward points faster and redeem them for maximum value.',
    'Rewards',
    'https://example.com/reward-points-strategies',
    ARRAY[]::text[],
    ARRAY[]::text[],
    true
  );