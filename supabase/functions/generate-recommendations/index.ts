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
    reward_preference: z.string().nullish(),
    preference_type: z.string().nullish()
  }).nullish(),
  customWeights: z.record(z.number()).optional(),
  snapshotType: z.enum(['statement_based', 'quick_spends', 'goal_based']).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
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
    
    console.log('[generate-recommendations] START:', {
      userId: user.id,
      analysisId,
      transactionsCount: transactions?.length || 0,
      snapshotType: snapshotType || 'statement_based',
      startTime: new Date().toISOString()
    });
    
    // PHASE 2: Parallel data fetching for speed
    const [profileResult, preferencesResult, featuresResult] = await Promise.all([
      profile ? Promise.resolve({ data: profile }) : supabaseClient
        .from('profiles')
        .select('age_range, income_band_inr, city')
        .eq('id', user.id)
        .single(),
      preferences ? Promise.resolve({ data: preferences }) : supabaseClient
        .from('user_preferences')
        .select('fee_sensitivity, travel_frequency, lounge_importance, reward_preference, preference_type')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseClient
        .from('user_features')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);
    
    const userProfile = profileResult.data || {};
    const userPreferences = preferencesResult.data || {};
    const userFeaturesData = featuresResult.data;
    
    // Normalize values
    const normalizedProfile = {
      age_range: userProfile?.age_range || 'not_specified',
      income_band_inr: userProfile?.income_band_inr || 'not_specified',
      city: userProfile?.city || 'metro'
    };

    const normalizedPreferences = {
      fee_sensitivity: userPreferences?.fee_sensitivity || 'moderate',
      travel_frequency: userPreferences?.travel_frequency || 'occasional',
      lounge_importance: userPreferences?.lounge_importance || 'nice_to_have',
      preference_type: userPreferences?.preference_type || 'balanced',
      reward_preference: userPreferences?.reward_preference || 'both'
    };
    
    console.log('[generate-recommendations] Data fetched:', {
      hasFeatures: !!userFeaturesData,
      hasTransactions: !!transactions?.length,
      timeElapsed: Date.now() - startTime
    });

    // Calculate spending summary
    const debitTransactions = transactions?.filter((t: any) => t.transactionType !== 'credit') || [];
    let totalSpending = debitTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    let categoryTotals: Record<string, number> = {};
    debitTransactions.forEach((t: any) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    let spendingSummarySource = 'transactions';
    
    // If no transactions, build from user_features
    if (debitTransactions.length === 0 && userFeaturesData) {
      spendingSummarySource = 'user_features';
      const monthlySpend = userFeaturesData.monthly_spend_estimate || 50000;
      totalSpending = monthlySpend;
      
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
    }

    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: ((amount as number) / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    // PHASE 2: Only top 3 categories for faster AI processing
    const topCategories = categories.slice(0, 3);

    // Pre-filter cards by income band
    const incomeBand = normalizedProfile.income_band_inr || 'not_specified';
    let maxFee = 10000;
    if (incomeBand === '0-25000' || incomeBand === 'below_25k') maxFee = 500;
    else if (incomeBand === '25000-50000' || incomeBand === '25k_50k') maxFee = 2000;
    else if (incomeBand === '50000-100000' || incomeBand === '50k_1L') maxFee = 5000;
    else if (incomeBand === '100000-200000' || incomeBand === '1L_2L') maxFee = 8000;
    
    // PHASE 2: Fetch cards and earn rates in parallel, reduced to 15 cards
    const [cardsResult, earnRatesResult] = await Promise.all([
      supabaseClient
        .from('credit_cards')
        .select('id, card_id, name, issuer, network, annual_fee, waiver_rule, forex_markup_pct, reward_type, category_badges, key_perks')
        .eq('is_active', true)
        .lte('annual_fee', maxFee)
        .limit(15),
      supabaseClient
        .from('card_benefits')
        .select('card_id, category, earn_rate, earn_type, earn_rate_unit')
    ]);
    
    const allCards = cardsResult.data || [];
    const allEarnRates = earnRatesResult.data || [];
    
    console.log('[generate-recommendations] Cards fetched:', {
      cardCount: allCards.length,
      timeElapsed: Date.now() - startTime
    });
    
    // Score cards if features available
    let scoredCards: any[] = [];
    
    if (userFeaturesData && allCards.length > 0) {
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
        category_spend: Object.keys(categoryTotals).length > 0 ? categoryTotals : {},
        travel_numeric: userFeaturesData.travel_numeric || 5,
        lounge_numeric: userFeaturesData.lounge_numeric || 5,
        reward_preference: userFeaturesData.reward_preference || 'both'
      };
      
      scoredCards = allCards.map(card => {
        const cardEarnRates = allEarnRates.filter(r => r.card_id === card.card_id);
        
        const { score, explanation } = calculateMatchScore(
          userFeatures,
          { ...card, earn_rates: cardEarnRates },
          customWeights
        );
        
        return { ...card, matchScore: score, matchExplanation: explanation };
      }).sort((a, b) => b.matchScore - a.matchScore);
      
      console.log('[generate-recommendations] Cards scored:', {
        topCard: scoredCards[0]?.name,
        topScore: scoredCards[0]?.matchScore,
        timeElapsed: Date.now() - startTime
      });
    } else {
      scoredCards = allCards;
    }
    
    // PHASE 2: Use faster model and reduced context
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // PHASE 2: Only top 4 pre-scored cards for AI
    const topScoredCards = scoredCards.slice(0, 4);
    const cardContext = topScoredCards.map(c => 
      `${c.name} (${c.issuer}) - Score: ${c.matchScore || 'N/A'}/100, Fee: ₹${c.annual_fee}`
    ).join('\n');

    // PHASE 2: Minimal spending context for speed
    const spendingContext = topCategories.length > 0
      ? topCategories.map(cat => `${cat.name}: ₹${Math.round(cat.amount).toLocaleString('en-IN')}`).join(', ')
      : `Monthly total: ₹${Math.round(totalSpending).toLocaleString('en-IN')}`;

    // PHASE 2: Add timeout (20s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let aiResponse;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // PHASE 2: Use flash-lite for 2x speed
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: `You are a credit card expert. Given pre-scored cards and spending, provide brief recommendations.
              
Rules:
- Recommend 3-4 cards from the list
- Use the match scores provided
- Be concise
- Return ONLY JSON, no markdown`
            },
            {
              role: 'user',
              content: `Spending: ${spendingContext}
Profile: ${normalizedProfile.income_band_inr} income, ${normalizedPreferences.fee_sensitivity} fee sensitivity, ${normalizedPreferences.reward_preference} preference

Top cards:
${cardContext}

Return JSON:
{
  "recommendedCards": [
    {"name": "card name", "issuer": "issuer", "reason": "brief why", "benefits": ["b1","b2"], "estimatedSavings": "₹X/year", "matchScore": number}
  ],
  "additionalInsights": ["insight1"]
}`
            }
          ]
        }),
        signal: controller.signal
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.error('[ai-timeout] Request timed out after 20s');
        // Return pre-scored cards without AI enhancement
        const fallbackRecommendations = {
          recommendedCards: topScoredCards.slice(0, 3).map(c => ({
            name: c.name,
            issuer: c.issuer,
            reason: c.matchExplanation?.join('. ') || 'Good match for your profile',
            benefits: c.key_perks?.slice(0, 3) || [],
            estimatedSavings: '₹5,000-15,000/year',
            matchScore: c.matchScore || 70
          })),
          additionalInsights: ['Recommendations based on your spending profile']
        };
        
        console.log('[generate-recommendations] Timeout fallback:', {
          cardCount: fallbackRecommendations.recommendedCards.length,
          totalTime: Date.now() - startTime
        });
        
        return new Response(
          JSON.stringify({ recommendations: fallbackRecommendations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

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
          JSON.stringify({ error: 'Payment required. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fallback to pre-scored cards
      const fallbackRecommendations = {
        recommendedCards: topScoredCards.slice(0, 3).map(c => ({
          name: c.name,
          issuer: c.issuer,
          reason: 'Matches your spending profile',
          benefits: c.key_perks?.slice(0, 3) || [],
          estimatedSavings: '₹5,000-15,000/year',
          matchScore: c.matchScore || 70
        })),
        additionalInsights: ['Based on your profile']
      };
      
      return new Response(
        JSON.stringify({ recommendations: fallbackRecommendations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('Failed to parse AI response, using fallback');
      recommendationsData = {
        recommendedCards: topScoredCards.slice(0, 3).map(c => ({
          name: c.name,
          issuer: c.issuer,
          reason: 'Matches your spending profile',
          benefits: c.key_perks?.slice(0, 3) || [],
          estimatedSavings: '₹5,000-15,000/year',
          matchScore: c.matchScore || 70
        })),
        additionalInsights: ['Based on your profile']
      };
    }

    // Update the analysis in the database (if analysisId provided)
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

        await supabaseClient
          .from('spending_analyses')
          .update({ analysis_data: updatedAnalysisData })
          .eq('id', analysisId);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log('[generate-recommendations] SUCCESS:', {
      userId: user.id,
      cardCount: recommendationsData.recommendedCards?.length || 0,
      totalTimeMs: totalTime,
      model: 'gemini-2.5-flash-lite'
    });

    return new Response(
      JSON.stringify({ 
        recommendations: recommendationsData,
        metadata: {
          processingTimeMs: totalTime,
          model: 'gemini-2.5-flash-lite',
          cardsEvaluated: allCards.length,
          optimization: 'phase2_speed'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unable to generate recommendations. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
