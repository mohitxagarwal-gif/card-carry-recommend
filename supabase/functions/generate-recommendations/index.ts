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
  transactions: z.array(TransactionSchema).min(1).max(5000)
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
    const { analysisId, transactions } = GenerateRecommendationsSchema.parse(body);
    console.log('Generating recommendations for user:', user.id, 'Analysis:', analysisId);

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

    // Generate recommendations using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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
            content: `You are a credit card recommendation expert for Indian users. Based on ACTUAL spending patterns (debits only, excluding refunds), recommend the most suitable Indian credit cards.

CRITICAL ANALYSIS RULES:
- Only consider DEBIT transactions (actual spending) for recommendations
- Exclude CREDIT transactions (refunds, cashback, salary) from spending calculations
- Focus recommendations on the TOP MERCHANTS where they spend the most
- Calculate savings based on REAL category percentages, not generic estimates
- Consider recurring expenses separately (subscriptions, bills, etc.)

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "recommendedCards": [
    {
      "name": "string (e.g., HDFC Swiggy Credit Card, AMEX Platinum Travel, ICICI Amazon Pay, Axis Magnus, SBI Cashback)",
      "issuer": "string (HDFC, ICICI, Axis, SBI, AMEX, etc.)",
      "reason": "string explaining why this card perfectly matches their TOP spending categories and merchants",
      "benefits": ["specific benefit tied to their spending", "benefit 2", "benefit 3"],
      "estimatedSavings": "string with CALCULATED savings (e.g., ₹15,000-20,000/year based on their ₹X spending on category Y)",
      "matchScore": number 1-100 (how well this card matches their spending pattern)
    }
  ],
  "additionalInsights": [
    "insight about their spending pattern",
    "specific optimization suggestion based on top merchants",
    "potential savings opportunity"
  ]
}

Recommend 3-4 actual Indian credit cards. Prioritize cards that give maximum rewards on their TOP categories and merchants. For each card, show HOW you calculated estimated savings.

Example calculation format:
"HDFC Swiggy Card gives 10% cashback on Swiggy. You spend ₹12,400/month on Swiggy, so savings = ₹1,240/month = ₹14,880/year"`
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
