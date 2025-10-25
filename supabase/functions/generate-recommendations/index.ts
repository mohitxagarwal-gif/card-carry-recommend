import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { analysisId, transactions } = await req.json();
    console.log('Generating recommendations for user:', user.id, 'Analysis:', analysisId);

    // Calculate spending summary from transactions
    const totalSpending = transactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((t: any) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: ((amount as number) / totalSpending) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategories = categories.slice(0, 5);

    // Format data for AI
    const spendingSummary = `
Total Spending: ₹${totalSpending.toLocaleString('en-IN')}
Number of Transactions: ${transactions.length}

Top Spending Categories:
${topCategories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}%)`).join('\n')}

All Categories:
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
            content: `You are a credit card recommendation expert for Indian users. Based on spending patterns, recommend the most suitable Indian credit cards.

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "recommendedCards": [
    {
      "name": "string (e.g., HDFC Diners Club Black, AMEX Platinum Travel, ICICI Amazon Pay, Axis Magnus)",
      "issuer": "string (HDFC, ICICI, Axis, SBI, AMEX, etc.)",
      "reason": "string explaining why this card perfectly matches their spending pattern",
      "benefits": ["specific benefit 1", "specific benefit 2", "specific benefit 3"],
      "estimatedSavings": "string (e.g., ₹15,000-20,000/year)"
    }
  ],
  "additionalInsights": ["insight 1 about optimization", "insight 2 about savings potential"]
}

Recommend 3-4 actual Indian credit cards based on their top spending categories. Be specific about benefits that match their spending. Calculate realistic savings based on typical cashback/rewards for those categories.`
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

  } catch (error) {
    console.error('Error in generate-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
