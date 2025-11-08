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
  analysisId: z.string().uuid(),
  transactions: z.array(TransactionSchema).min(1).max(5000),
  profile: z.object({
    age_range: z.string().optional(),
    income_band_inr: z.string().optional(),
    city: z.string().optional()
  }).optional(),
  preferences: z.object({
    fee_sensitivity: z.string().optional(),
    travel_frequency: z.string().optional(),
    lounge_importance: z.string().optional(),
    preference_type: z.string().optional()
  }).optional()
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
    const { analysisId, transactions, profile, preferences } = GenerateRecommendationsSchema.parse(body);
    
    console.log('[generate-recommendations] Received request:', {
      userId: user.id,
      analysisId,
      transactionsCount: transactions.length,
      hasProfile: !!profile,
      hasPreferences: !!preferences
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
    
    console.log('[generate-recommendations] User context:', {
      profile: userProfile,
      preferences: userPreferences
    });

    // Calculate spending summary from transactions (only debits = actual spending)
    const debitTransactions = transactions.filter((t: any) => t.transactionType !== 'credit');
    const creditTransactions = transactions.filter((t: any) => t.transactionType === 'credit');
    
    const totalSpending = debitTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalCredits = creditTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    const categoryTotals: Record<string, number> = {};
    debitTransactions.forEach((t: any) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
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

    // Format data for AI with enhanced context
    const spendingSummary = `
SPENDING OVERVIEW:
Total Debits (Spending): ₹${totalSpending.toLocaleString('en-IN')}
Total Credits (Refunds/Income): ₹${totalCredits.toLocaleString('en-IN')}
Net Spending: ₹${(totalSpending - totalCredits).toLocaleString('en-IN')}
Number of Transactions: ${debitTransactions.length} debits, ${creditTransactions.length} credits
Average Transaction Size: ₹${(totalSpending / debitTransactions.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}

TOP MERCHANTS (by spending):
${topMerchants.join('\n')}

RECURRING EXPENSES:
${recurringMerchants.length > 0 ? recurringMerchants.slice(0, 5).join(', ') : 'None detected'}

TOP SPENDING CATEGORIES:
${topCategories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}% of total spending)`).join('\n')}

ALL CATEGORIES BREAKDOWN:
${categories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')}`).join('\n')}
    `.trim();

    // Phase 5: Fetch user features and use EAV scoring
    console.log('[generate-recommendations] Fetching user features and card benefits...');
    
    const { data: userFeaturesData } = await supabaseClient
      .from('user_features')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // If no derived features exist, generate them first
    if (!userFeaturesData) {
      console.log('[generate-recommendations] No user features found, deriving...');
      const { error: deriveError } = await supabaseClient.functions.invoke('derive-user-features', {
        body: { userId: user.id }
      });
      
      if (deriveError) {
        console.error('[generate-recommendations] Failed to derive features:', deriveError);
      } else {
        // Refetch after derivation
        const { data: newFeatures } = await supabaseClient
          .from('user_features')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (newFeatures) {
          console.log('[generate-recommendations] Features derived successfully');
        }
      }
    }
    
    // Fetch all active cards with their benefits
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
        key_perks,
        reward_structure
      `)
      .eq('is_active', true);
    
    if (cardsError) throw cardsError;
    
    // Fetch benefits for scoring
    const { data: allBenefits } = await supabaseClient
      .from('card_benefits')
      .select('*');
    
    console.log('[generate-recommendations] Found', allCards?.length || 0, 'active cards');
    
    // Use EAV scoring if features are available
    let scoredCards: any[] = [];
    
    if (userFeaturesData && allCards) {
      const { calculateMatchScore } = await import('./scorer.ts');
      
      const userFeatures = {
        pif_score: userFeaturesData.pif_score || 50,
        fee_tolerance_numeric: userFeaturesData.fee_tolerance_numeric || 1500,
        travel_numeric: userFeaturesData.travel_numeric || 5,
        lounge_numeric: userFeaturesData.lounge_numeric || 5,
        forex_spend_pct: userFeaturesData.forex_spend_pct || 0,
        acceptance_risk_amex: userFeaturesData.acceptance_risk_amex || 60,
        total_monthly_spend: userFeaturesData.total_monthly_spend || totalSpending / 3,
        category_spend: categoryTotals
      };
      
      // Score each card
      scoredCards = allCards.map(card => {
        const cardBenefits = (allBenefits || []).filter(b => 
          !b.applies_to_card_ids || b.applies_to_card_ids.includes(card.card_id)
        );
        
        const { score, explanation } = calculateMatchScore(userFeatures, {
          ...card,
          benefits: cardBenefits
        });
        
        return {
          ...card,
          matchScore: score,
          matchExplanation: explanation
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
      
      console.log('[generate-recommendations] Top 3 scored cards:', 
        scoredCards.slice(0, 3).map(c => ({ name: c.name, score: c.matchScore }))
      );
    }
    
    // Generate recommendations using Lovable AI with scored cards
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const topScoredCards = scoredCards.slice(0, 8);
    const cardContext = topScoredCards.map(c => 
      `${c.name} (${c.issuer}) - Match Score: ${c.matchScore}/100, Fee: ₹${c.annual_fee}, ${c.matchExplanation?.join(', ') || ''}`
    ).join('\n');

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

USER PROFILE:
- Age: ${userProfile?.age_range || 'Not specified'}
- Income: ${userProfile?.income_band_inr || 'Not specified'}/month
- Location: ${userProfile?.city || 'Not specified'}
- Fee Sensitivity: ${userPreferences?.fee_sensitivity || 'medium'}
- Travel Frequency: ${userPreferences?.travel_frequency || 'moderate'}

TOP-RANKED CARDS (by AI match score):
${cardContext}

CRITICAL RULES:
- ONLY recommend cards from the above list
- Prioritize cards with higher match scores (75+ are excellent fits)
- Use ACTUAL spending data to calculate savings
- Focus on the top 3-4 cards with best scores
- Consider fee vs benefits tradeoff for each income band
- For travel frequency 'frequent', emphasize lounge/forex benefits
- For fee_sensitivity 'high', prioritize cards with scores 75+ AND fees under ₹1500

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
  ]
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

    // Update the analysis in the database with recommendations
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
