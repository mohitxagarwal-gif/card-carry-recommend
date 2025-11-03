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
  description: z.string().max(500),
  amount: z.number().positive(),
  category: z.string().max(100)
});

const ExtractedDataSchema = z.object({
  extractedData: z.array(z.object({
    fileName: z.string().min(1).max(255),
    transactions: z.array(TransactionSchema).min(1).max(5000),
    totalAmount: z.number().positive(),
    categoryTotals: z.record(z.string(), z.number())
  })).min(1).max(3)
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
    const { extractedData } = ExtractedDataSchema.parse(body);
    console.log('Analyzing statements for user:', user.id, 'Statements:', extractedData.length);

    // Format the extracted transaction data for AI analysis
    const formattedData = extractedData.map((ed: any) => {
      return `
File: ${ed.fileName}
Period: ${ed.dateRange?.start || 'N/A'} to ${ed.dateRange?.end || 'N/A'}
Total Amount: ₹${ed.totalAmount?.toLocaleString('en-IN') || '0'}
Number of Transactions: ${ed.transactions.length}

Category Breakdown:
${Object.entries(ed.categoryTotals || {}).map(([cat, amt]: [string, any]) => `- ${cat}: ₹${amt.toLocaleString('en-IN')}`).join('\n')}

Transactions:
${ed.transactions.slice(0, 50).map((t: any) => `${t.date}: ${t.description} - ₹${t.amount.toLocaleString('en-IN')} (${t.category})`).join('\n')}
${ed.transactions.length > 50 ? `... and ${ed.transactions.length - 50} more transactions` : ''}
      `.trim();
    }).join('\n\n---\n\n');

    // Combine all transactions from all statements
    const allTransactions = extractedData.flatMap((ed: any) => ed.transactions);
    
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
            content: `You are a financial analyst specializing in transaction categorization for Indian users. Analyze transaction data and provide spending insights with accurate categorization.

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "totalSpending": number,
  "period": "string describing period",
  "categories": [
    { "name": "string", "amount": number, "percentage": number }
  ],
  "topCategories": [
    { "name": "string", "amount": number, "percentage": number }
  ],
  "insights": ["insight 1 about spending patterns", "insight 2 about categories", "insight 3 about trends"],
  "summary": "string with 2-3 sentence overview of spending patterns"
}

Focus on accurate categorization. Use these standard categories when possible:
- Food & Dining
- Shopping & E-commerce
- Transportation
- Utilities & Bills
- Entertainment & Subscriptions
- Healthcare
- Education
- Groceries
- Financial Services
- Travel
- Other (only when transaction doesn't fit other categories)`
          },
          {
            role: 'user',
            content: `Analyze and categorize this transaction data:\n\n${formattedData}`
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

    // Store the analysis in the database with transactions
    const { data: analysis, error: dbError } = await supabaseClient
      .from('spending_analyses')
      .insert({
        user_id: user.id,
        statement_paths: extractedData.map((ed: any) => ed.fileName),
        analysis_data: {
          ...analysisData,
          transactions: allTransactions
        }
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

  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Error in analyze-statements:`, error);
    
    // Return user-friendly error message (no correlation ID exposed)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unable to analyze statements. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
