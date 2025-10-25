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
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
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

    const { statementPaths } = await req.json();
    console.log('Analyzing statements for user:', user.id, 'Files:', statementPaths);

    // Download and read the statement files
    let statementContents = [];
    for (const path of statementPaths) {
      const { data, error } = await supabaseClient.storage
        .from('statements')
        .download(path);
      
      if (error) {
        console.error('Error downloading file:', error);
        continue;
      }
      
      const text = await data.text();
      statementContents.push(text);
    }

    const combinedStatements = statementContents.join('\n\n---\n\n');

    // Analyze using Lovable AI
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
            content: `You are a financial analyst specializing in credit card recommendations for Indian users. Analyze bank/credit card statements and provide spending insights across categories.

Your analysis should include:
1. Total spending over the period
2. Spending breakdown by categories (dining, travel, shopping, groceries, entertainment, etc.)
3. Top 3 spending categories with percentages
4. Recommended credit cards based on spending patterns (specifically Indian credit cards)
5. Potential savings with recommended cards

Return a JSON object with this structure:
{
  "totalSpending": number,
  "period": "string describing period",
  "categories": [
    { "name": "string", "amount": number, "percentage": number }
  ],
  "topCategories": [
    { "name": "string", "amount": number, "percentage": number }
  ],
  "recommendedCards": [
    {
      "name": "string",
      "issuer": "string",
      "reason": "string",
      "benefits": ["string"],
      "estimatedSavings": "string"
    }
  ],
  "insights": ["string"],
  "summary": "string"
}`
          },
          {
            role: 'user',
            content: `Analyze these bank statements and provide spending insights with credit card recommendations:\n\n${combinedStatements}`
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
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Parse the JSON from the AI response
    let analysisData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      analysisData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback: use the raw text as summary
      analysisData = {
        summary: analysisText,
        totalSpending: 0,
        categories: [],
        recommendedCards: []
      };
    }

    // Store the analysis in the database
    const { data: analysis, error: dbError } = await supabaseClient
      .from('spending_analyses')
      .insert({
        user_id: user.id,
        statement_paths: statementPaths,
        analysis_data: analysisData
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Analysis completed successfully for user:', user.id);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-statements function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
