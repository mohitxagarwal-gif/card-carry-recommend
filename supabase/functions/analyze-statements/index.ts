import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phase 0: Standard categories
const STANDARD_CATEGORIES = [
  "Food & Dining",
  "Shopping & E-commerce",
  "Travel & Transport",
  "Bills & Utilities",
  "Entertainment & Subscriptions",
  "Health & Wellness",
  "Education",
  "Investments & Savings",
  "Other"
];

function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "Other";
  
  const lower = category.toLowerCase().trim();
  const mappings: Record<string, string> = {
    "food & dining": "Food & Dining",
    "food and dining": "Food & Dining",
    "shopping & e-commerce": "Shopping & E-commerce",
    "shopping and e-commerce": "Shopping & E-commerce",
    "travel & transport": "Travel & Transport",
    "transportation": "Travel & Transport",
    "bills & utilities": "Bills & Utilities",
    "utilities & bills": "Bills & Utilities",
    "entertainment & subscriptions": "Entertainment & Subscriptions",
    "entertainment": "Entertainment & Subscriptions",
    "health & wellness": "Health & Wellness",
    "healthcare": "Health & Wellness",
    "education": "Education",
    "investments & savings": "Investments & Savings",
    "other": "Other"
  };
  
  return mappings[lower] || "Other";
}

// Input validation
const TransactionSchema = z.object({
  transaction_id: z.string().optional(),
  date: z.string().max(50),
  merchant: z.string().max(500),
  amount: z.number().positive(),
  category: z.string().max(100),
  transactionType: z.enum(['debit', 'credit']).optional()
});

const ExtractedDataSchema = z.object({
  extractedData: z.array(z.object({
    fileName: z.string().min(1).max(255),
    batchId: z.string().optional(),
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
    const { extractedData, analysisRunId } = body;
    ExtractedDataSchema.parse({ extractedData });
    
    console.log('[analyze-statements] Starting analysis for user:', user.id, 'Files:', extractedData.length);

    // Phase 0: Normalize categories and Phase 3: Process ALL transactions (no 50-limit)
    const allTransactions = extractedData.flatMap((ed: any) => 
      ed.transactions.map((t: any) => ({
        ...t,
        category: normalizeCategory(t.category),
        transactionType: t.transactionType || "debit"
      }))
    );
    
    // Phase 4: Apply inclusion rules for aggregates
    const debitTransactions = allTransactions.filter((t: any) => t.transactionType === 'debit');
    const totalSpending = debitTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Calculate category totals from debits only
    const categoryTotals: Record<string, number> = {};
    debitTransactions.forEach((t: any) => {
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
    
    // Phase 3: Send aggregated summary to AI instead of raw transactions
    const spendingSummary = `
SPENDING OVERVIEW:
Total Spending: ₹${totalSpending.toLocaleString('en-IN')}
Transaction Count: ${debitTransactions.length}
Average Transaction: ₹${(totalSpending / debitTransactions.length).toLocaleString('en-IN', { maximumFractionDigits: 0 })}

TOP CATEGORIES:
${topCategories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.percentage.toFixed(1)}%)`).join('\n')}

ALL CATEGORIES:
${categories.map((cat) => `- ${cat.name}: ₹${cat.amount.toLocaleString('en-IN')}`).join('\n')}
    `.trim();
    
    console.log('[analyze-statements] Transactions:', {
      total: allTransactions.length,
      debits: debitTransactions.length,
      totalSpending
    });

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
            content: `You are a financial analyst. Analyze spending patterns and provide insights.

Return ONLY valid JSON (no markdown):
{
  "totalSpending": number,
  "period": "string",
  "categories": [{ "name": "string", "amount": number, "percentage": number }],
  "topCategories": [{ "name": "string", "amount": number, "percentage": number }],
  "insights": ["insight1", "insight2", "insight3"],
  "summary": "string"
}`
          },
          {
            role: 'user',
            content: `Analyze this spending data:\n\n${spendingSummary}`
          }
        ]
      })
    });

    if (!aiResponse.ok) {
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
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    let analysisData;
    try {
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      analysisData = JSON.parse(jsonStr);
    } catch (e) {
      analysisData = {
        summary: analysisText,
        totalSpending,
        categories,
        topCategories
      };
    }

    // Store the analysis with reference to analysis run (passed from Upload)
    const { data: analysis, error: dbError } = await supabaseClient
      .from('spending_analyses')
      .insert({
        user_id: user.id,
        analysis_run_id: analysisRunId,
        statement_paths: extractedData.map((ed: any) => ed.fileName),
        analysis_data: {
          ...analysisData,
          transactions: allTransactions
        },
        extraction_method: 'ai_powered',
        extraction_metadata: {
          model: 'google/gemini-2.5-flash',
          totalFiles: extractedData.length,
          totalTransactions: allTransactions.length,
          extractedAt: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('[analyze-statements] DB error:', dbError);
      throw dbError;
    }

    // PHASE 1B: Also write to normalized analysis_transactions table
    console.log('[analyze-statements] Writing transactions to normalized table');
    const transactionsForInsert = allTransactions.map((t: any) => ({
      user_id: user.id,
      analysis_id: analysis.id,
      transaction_id: t.transaction_id || crypto.randomUUID(),
      transaction_hash: t.transaction_id || crypto.randomUUID(),
      posted_date: t.date,
      amount_minor: Math.round(t.amount * 100),
      merchant_raw: t.merchant,
      merchant_normalized: t.merchant,
      category: t.category,
      subcategory: t.subcategory || null,
    }));

    const { error: transactionsError } = await supabaseClient
      .from('analysis_transactions')
      .insert(transactionsForInsert);

    if (transactionsError) {
      console.error('[analyze-statements] Error writing transactions:', transactionsError);
      // Don't fail the whole analysis if normalized table insert fails
    } else {
      console.log('[analyze-statements] Successfully wrote', transactionsForInsert.length, 'transactions');
    }

    console.log('[analyze-statements] Success, analysis ID:', analysis.id);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[analyze-statements] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
