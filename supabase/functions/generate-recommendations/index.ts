import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const TransactionSchema = z.object({
  date: z.string().max(50),
  merchant: z.string().max(500),
  amount: z.number().positive(),
  category: z.string().max(100),
  transactionType: z.enum(['debit', 'credit']).optional()
});

const GenerateRecommendationsSchema = z.object({
  analysisId: z.string().uuid().nullish(),
  transactions: z.array(TransactionSchema).min(1).max(5000).optional(),
  profile: z.object({
    age_range: z.string().nullish(),
    income_band_inr: z.string().nullish(),
    city: z.string().nullish()
  }).nullish(),
  preferences: z.object({
    fee_sensitivity: z.string().nullish(),
    travel_frequency: z.string().nullish(),
    lounge_importance: z.string().nullish(),
    preference_type: z.string().nullish()
  }).nullish(),
  customWeights: z.record(z.number()).optional(),
  snapshotType: z.enum(['statement_based', 'quick_spends', 'goal_based']).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { analysisId, transactions, profile, preferences, customWeights, snapshotType } = GenerateRecommendationsSchema.parse(body);
    
    console.log('[generate-recommendations] Received request:', {
      userId: user.id,
      analysisId,
      transactionsCount: transactions?.length || 0,
      hasProfile: !!profile,
      hasPreferences: !!preferences,
      snapshotType: snapshotType || 'statement_based',
      hasCustomWeights: !!customWeights
    });
    
    // Fetch user profile if not provided
    let userProfile = profile;
    let userPreferences = preferences;
    
    if (!userProfile) {
      const { data: fetchedProfile } = await supabaseClient
        .from('profiles')
        .select('age_range, income_band_inr, city')
        .eq('id', user.id)
        .single();
      
      userProfile = fetchedProfile || {};
    }
    
    if (!userPreferences) {
      const { data: fetchedPreferences } = await supabaseClient
        .from('user_preferences')
        .select('fee_sensitivity, travel_frequency, lounge_importance, preference_type')
        .eq('user_id', user.id)
        .maybeSingle();
      
      userPreferences = fetchedPreferences || {};
    }
    
    // Normalize null values to defaults
    const normalizedProfile = {
      age_range: userProfile?.age_range || 'not_specified',
      income_band_inr: userProfile?.income_band_inr || 'not_specified',
      city: userProfile?.city || 'metro'
    };

    const normalizedPreferences = {
      fee_sensitivity: userPreferences?.fee_sensitivity || 'moderate',
      travel_frequency: userPreferences?.travel_frequency || 'occasional',
      lounge_importance: userPreferences?.lounge_importance || 'nice_to_have',
      preference_type: userPreferences?.preference_type || 'balanced'
    };
    
    console.log('[generate-recommendations] User context:', {
      profile: userProfile,
      preferences: userPreferences
    });
    
    console.log('[generate-recommendations] Normalized profile:', normalizedProfile);
    console.log('[generate-recommendations] Profile completeness:', {
      hasAge: !!userProfile?.age_range,
      hasIncome: !!userProfile?.income_band_inr,
      hasCity: !!userProfile?.city
    });
    console.log('[generate-recommendations] Preferences completeness:', {
      hasFee: !!userPreferences?.fee_sensitivity,
      hasTravel: !!userPreferences?.travel_frequency,
      hasLounge: !!userPreferences?.lounge_importance,
      hasPreferenceType: !!userPreferences?.preference_type
    });

    // Fetch user features early (needed for manual flows)
    console.log('[generate-recommendations] Fetching user features...');
    const { data: userFeaturesData } = await supabaseClient
      .from('user_features')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Calculate spending summary from transactions (only debits = actual spending)
    // For manual flows without transactions, fetch from user_features
    const debitTransactions = transactions?.filter((t: any) => t.transactionType !== 'credit') || [];
    const creditTransactions = transactions?.filter((t: any) => t.transactionType === 'credit') || [];
    
    let totalSpending = debitTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalCredits = creditTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    let categoryTotals: Record<string, number> = {};
    debitTransactions.forEach((t: any) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    let spendingSummarySource = 'transactions';
    
    // If no transactions, build from user_features (QuickSpends/Goal-Based flows)
    if (debitTransactions.length === 0 && userFeaturesData) {
      spendingSummarySource = 'user_features';
      const monthlySpend = userFeaturesData.monthly_spend_estimate || 50000;
      totalSpending = monthlySpend;
      
      // Map user_features spend shares to category totals
      const categoryMapping: Record<string, string> = {
        'online_share': 'Online',
        'dining_share': 'Dining',
        'groceries_share': 'Groceries',
        'travel_share': 'Travel',
        'entertainment_share': 'Entertainment',
        'bills_utilities_share': 'Bills & Utilities',
        'cabs_fuel_share': 'Fuel',
        'rent_share': 'Rent',
        'forex_share': 'International'
      };
      
      for (const [key, categoryName] of Object.entries(categoryMapping)) {
        const shareValue = userFeaturesData[key as keyof typeof userFeaturesData];
        if (typeof shareValue === 'number' && shareValue > 0) {
          categoryTotals[categoryName] = monthlySpend * shareValue;
        }
      }
      
      console.log('[generate-recommendations] Built spending from user_features:', {
        monthlySpend,
        categoryCount: Object.keys(categoryTotals).length
      });
    }
    
    // Get top merchants by spending
    const merchantTotals: Record<string, number> = {};
    debitTransactions.forEach((t: any) => {
      merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
    });
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => `${name} (₹${(amount as number).toLocaleString('en-IN')})`);
    
    // Detect recurring expenses
    const merchantFrequency = new Map<string, number>();
    debitTransactions.forEach((t: any) => {
      merchantFrequency.set(t.merchant, (merchantFrequency.get(t.merchant) || 0) + 1);
    });
    const recurringMerchants = Array.from(merchantFrequency.entries())
      .filter(([_, count]) => count >= 2)
      .map(([name]) => name);

    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: ((amount as number) / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategories = categories.slice(0, 5);

    // Data source context for AI prompting
    const dataSourceNote = snapshotType === 'quick_spends'
      ? 'User provided estimated spending patterns (self-reported, may be less granular than statement analysis)'
      : snapshotType === 'goal_based'
      ? 'User is optimizing for specific goals - prioritize cards matching their stated priorities'
      : 'Spending calculated from actual bank statement transactions (highest precision)';

    // Format data for AI with enhanced context
    const spendingSummary = `
SPENDING OVERVIEW (Source: ${spendingSummarySource}):
Total Debits (Spending): ₹${totalSpending.toLocaleString('en-IN')}
${debitTransactions.length > 0 ? `Total Credits (Refunds/Income): ₹${totalCredits.toLocaleString('en-IN')}
Net Spending: ₹${(totalSpending - totalCredits).toLocaleString('en-IN')}
Number of Transactions: ${debitTransactions.length} debits, ${creditTransactions.length} credits
Average Transaction Size: ₹${(totalSpending / debitTransactions.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Monthly estimate provided by user'}

${topMerchants.length > 0 ? `TOP MERCHANTS (by spending):
${topMerchants.join('\n')}

RECURRING EXPENSES:
${recurringMerchants.length > 0 ? recurringMerchants.slice(0, 5).join(', ') : 'None detected'}` : ''}

TOP SPENDING CATEGORIES:
${topCategories.length > 0 ? topCategories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}% of total spending)`).join('\n') : 'No category breakdown available'}

${categories.length > 5 ? `ALL CATEGORIES BREAKDOWN:
${categories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')}`).join('\n')}` : ''}
    `.trim();

    // Phase 5: Fetch card earn rates and use scoring
    console.log('[generate-recommendations] Fetching card earn rates...');
    
    // If no features, try to derive them
    if (!userFeaturesData && transactions && transactions.length > 0) {
      console.log('[generate-recommendations] Deriving features from transactions...');
      await supabaseClient.functions.invoke('derive-user-features', {
        body: { userId: user.id }
      });
    }
    
    // Fetch all active cards with their earn rates
    const { data: allCards, error: cardsError } = await supabaseClient
      .from('credit_cards')
      .select(`
        id,
        card_id,
        name,
        issuer,
        network,
        annual_fee,
        waiver_rule,
        forex_markup_pct,
        reward_type,
        category_badges,
        key_perks
      `)
      .eq('is_active', true)
      .limit(50);
    
    if (cardsError) throw cardsError;
    
    // Fetch earn rates for all cards
    const { data: allEarnRates } = await supabaseClient
      .from('card_benefits')
      .select('card_id, category, earn_rate, earn_type, earn_rate_unit');
    
    console.log('[generate-recommendations] Found', allCards?.length || 0, 'active cards');
    
    // Score cards if features available
    let scoredCards: any[] = [];
    
    if (userFeaturesData && allCards) {
      const { calculateMatchScore } = await import('./scorer.ts');
      
      const userFeatures = {
        pif_score: userFeaturesData.pif_score || 50,
        fee_tolerance_numeric: userFeaturesData.fee_tolerance_numeric || 1500,
        acceptance_risk_amex: userFeaturesData.acceptance_risk_amex || 60,
        monthly_spend_estimate: userFeaturesData.monthly_spend_estimate || totalSpending / 3,
        dining_share: userFeaturesData.dining_share || 0,
        groceries_share: userFeaturesData.groceries_share || 0,
        travel_share: userFeaturesData.travel_share || 0,
        entertainment_share: userFeaturesData.entertainment_share || 0,
        online_share: userFeaturesData.online_share || 0,
        forex_share: userFeaturesData.forex_share || 0,
        category_spend: Object.keys(categoryTotals).length > 0 ? categoryTotals : {}
      };
      
      // Apply custom weights if provided (for goal-based flows)
      if (customWeights) {
        console.log('[generate-recommendations] Custom weights provided:', customWeights);
      }
      
      // Score each card (pass customWeights to scorer)
      scoredCards = allCards.map(card => {
        const cardEarnRates = (allEarnRates || []).filter(r => r.card_id === card.card_id);
        
        const { score, explanation } = calculateMatchScore(
          userFeatures,
          {
            ...card,
            earn_rates: cardEarnRates
          },
          customWeights // Pass custom weights to scorer
        );
        
        return {
          ...card,
          matchScore: score,
          matchExplanation: explanation
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
      
      console.log('[generate-recommendations] Top 5 scored cards:', 
        scoredCards.slice(0, 5).map(c => ({ name: c.name, score: c.matchScore }))
      );
    } else {
      // No scoring, use all cards
      scoredCards = allCards || [];
      console.log('[generate-recommendations] No user features, using all cards');
    }
    
    // Generate recommendations using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const topScoredCards = scoredCards.slice(0, 10);
    const cardContext = topScoredCards.length > 0 
      ? topScoredCards.map(c => 
          `${c.name} (${c.issuer})${c.matchScore ? ` - Match: ${c.matchScore}/100` : ''}, Fee: ₹${c.annual_fee}`
        ).join('\n')
      : 'All available cards';

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a credit card recommendation expert for Indian users. Our AI scoring engine has already ranked cards by fit score. Focus on the TOP-SCORING cards below.

DATA CONTEXT: ${dataSourceNote}

USER PROFILE:
- Age: ${normalizedProfile.age_range}${userProfile?.age_range ? '' : ' (estimated)'}
- Income: ${normalizedProfile.income_band_inr}${userProfile?.income_band_inr ? '' : ' (estimated)'}/month
- Location: ${normalizedProfile.city}${userProfile?.city ? '' : ' (assumed metro)'}
- Fee Sensitivity: ${normalizedPreferences.fee_sensitivity}${userPreferences?.fee_sensitivity ? '' : ' (default)'}
- Travel Frequency: ${normalizedPreferences.travel_frequency}${userPreferences?.travel_frequency ? '' : ' (default)'}

TOP-RANKED CARDS (by AI match score):
${cardContext}

CRITICAL RULES:
- ONLY recommend cards from the above list
- Prioritize cards with higher match scores (75+ are excellent fits)
- Use ${spendingSummarySource === 'transactions' ? 'ACTUAL spending data' : 'estimated spending'} to calculate savings
- Focus on the top 3-4 cards with best scores
- Consider fee vs benefits tradeoff for each income band
- For travel frequency 'frequent', emphasize lounge/forex benefits
- For fee_sensitivity 'high', prioritize cards with scores 75+ AND fees under ₹1500
${snapshotType === 'goal_based' ? '- User has specific goals - prioritize cards matching their stated goals' : ''}

Return ONLY valid JSON with this EXACT structure (no markdown):
{
  "recommendedCards": [
    {
      "name": "exact card name from list above",
      "issuer": "issuer name",
      "reason": "why this high-scoring card matches their spending + profile",
      "benefits": ["benefit 1", "benefit 2", "benefit 3"],
      "estimatedSavings": "₹X-Y/year based on their actual ₹Z spending on category",
      "matchScore": number from the list above
    }
  ],
  "additionalInsights": [
    "insight about spending pattern",
    "optimization suggestion",
    "potential savings opportunity"
  ],
  "confidence": "${spendingSummarySource === 'transactions' ? 'high' : 'medium'}"
}

Recommend 3-4 cards with highest scores. Show CALCULATED savings and explain WHY the match score is high.`
          },
          {
            role: 'user',
            content: `Based on this spending pattern, recommend the best credit cards:\n\n${spendingSummary}`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI recommendation generation failed');
    }

    const aiData = await aiResponse.json();
    const recommendationsText = aiData.choices[0].message.content;
    
    // Parse the JSON from the AI response
    let recommendationsData;
    try {
      const jsonMatch = recommendationsText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : recommendationsText;
      recommendationsData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      recommendationsData = {
        recommendedCards: [],
        additionalInsights: ['Unable to generate recommendations at this time.']
      };
    }

    // Update the analysis in the database with recommendations (if analysisId provided)
    if (analysisId) {
      const { data: existingAnalysis } = await supabaseClient
        .from('spending_analyses')
        .select('analysis_data')
        .eq('id', analysisId)
        .single();

      if (existingAnalysis) {
        const updatedAnalysisData = {
          ...existingAnalysis.analysis_data,
          recommendedCards: recommendationsData.recommendedCards,
          insights: [
            ...(existingAnalysis.analysis_data.insights || []),
            ...(recommendationsData.additionalInsights || [])
          ]
        };

        const { error: updateError } = await supabaseClient
          .from('spending_analyses')
          .update({ analysis_data: updatedAnalysisData })
          .eq('id', analysisId);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw updateError;
        }
      }
    }

    console.log('Recommendations generated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ recommendations: recommendationsData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Error in generate-recommendations:`, error);
    
    // Return user-friendly error message (no correlation ID exposed)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unable to generate recommendations. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
