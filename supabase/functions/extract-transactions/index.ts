import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RequestSchema = z.object({
  pdfText: z.string().min(10).max(500000),
  fileName: z.string().min(1).max(255),
  statementType: z.enum(['credit_card', 'bank', 'unknown']).default('unknown')
});

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

// Phase 1: Transaction ID generation (Deno version)
async function generateTransactionId(params: {
  userId: string;
  batchId: string;
  postedDate: string;
  amountMinor: number;
  normalizedMerchant: string;
  lineNumber: number;
}): Promise<string> {
  const { userId, batchId, postedDate, amountMinor, normalizedMerchant, lineNumber } = params;
  const composite = `${userId}|${batchId}|${postedDate}|${amountMinor}|${normalizedMerchant}|${lineNumber}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `txn_${hashHex}`;
}

async function generateTransactionHash(params: {
  postedDate: string;
  amountMinor: number;
  normalizedMerchant: string;
}): Promise<string> {
  const { postedDate, amountMinor, normalizedMerchant } = params;
  const composite = `${postedDate}|${amountMinor}|${normalizedMerchant}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const validatedData = RequestSchema.parse(body);
    const { pdfText, fileName, statementType } = validatedData;
    const batchId = `batch_${Date.now()}`;

    const startTime = Date.now();
    console.log(`[extract-transactions] Processing ${fileName} (${statementType}) for user ${user.id}`, {
      textLength: pdfText.length,
      timestamp: new Date().toISOString(),
      batchId
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Detect statement format
    const detectFormat = (text: string): string => {
      const patterns: Record<string, RegExp> = {
        'HDFC Credit Card': /HDFC\s+BANK.*CREDIT\s+CARD/i,
        'ICICI Bank': /ICICI\s+BANK/i,
        'SBI Credit Card': /STATE\s+BANK.*CARD/i,
        'Axis Bank': /AXIS\s+BANK/i,
        'Kotak Mahindra': /KOTAK.*MAHINDRA/i,
        'IDFC First': /IDFC\s+FIRST/i,
        'American Express': /AMERICAN\s+EXPRESS/i,
      };
      
      for (const [format, regex] of Object.entries(patterns)) {
        if (regex.test(text)) return format;
      }
      return 'Unknown Format';
    };

    const detectedFormat = detectFormat(pdfText);
    console.log(`[format-detected] ${detectedFormat}`);

    const systemPrompt = `You are an expert at extracting transaction data from Indian bank and credit card statements.

CRITICAL RULES:
1. Extract ALL transactions from the entire document
2. Dates: Convert to DD/MM/YYYY format
3. Transaction Type: DEBIT (money out) or CREDIT (money in)
4. Merchants: Clean and normalize names (remove refs, IDs, cities)
5. Amounts: Positive numbers in INR
6. Categories: Use ONLY these: ${STANDARD_CATEGORIES.join(', ')}

Return JSON only. No markdown formatting.`;

    const userPrompt = `Extract ALL transactions from this ${statementType} statement:\n\n${pdfText}\n\nStatement file: ${fileName}`;

    const tools = [{
      type: "function",
      function: {
        name: "extract_transactions",
        description: "Extract structured transaction data",
        parameters: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "DD/MM/YYYY format" },
                  merchant: { type: "string", description: "Cleaned merchant name" },
                  amount: { type: "number", description: "Positive number in INR" },
                  transactionType: { type: "string", enum: ["debit", "credit"] },
                  category: { type: "string", enum: STANDARD_CATEGORIES }
                },
                required: ["date", "merchant", "amount", "transactionType", "category"]
              }
            },
            metadata: {
              type: "object",
              properties: {
                totalTransactions: { type: "number" },
                dateRangeStart: { type: "string" },
                dateRangeEnd: { type: "string" },
                statementFormat: { type: "string" }
              },
              required: ["totalTransactions", "dateRangeStart", "dateRangeEnd"]
            }
          },
          required: ["transactions", "metadata"]
        }
      }
    }];

    const isScanned = pdfText.length < 500;
    if (isScanned) {
      console.log('[scanned-pdf-detected]');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Scanned PDF detected. Please use digital PDF from bank.',
          suggestion: 'Download e-Statement instead of scanned copy.'
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[ai-request-start] Model: google/gemini-2.5-flash`);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_transactions" } }
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please wait.' }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service payment required.' }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const processingTime = Date.now() - startTime;
    
    if (!aiData.choices?.[0]?.message?.tool_calls?.[0]) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI could not extract data' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const toolCall = aiData.choices[0].message.tool_calls[0];
    const extracted = JSON.parse(toolCall.function.arguments);

    // Phase 1 & 5: Deduplicate and add transaction IDs
    const uniqueTransactions = extracted.transactions.filter((t: any, idx: number, arr: any[]) => 
      arr.findIndex(x => 
        x.date === t.date && 
        x.merchant === t.merchant && 
        Math.abs(x.amount - t.amount) < 0.01
      ) === idx
    );

    if (uniqueTransactions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No transactions found' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Phase 1: Generate transaction IDs and Phase 5: Check for duplicates
    const enhancedTransactions = await Promise.all(
      uniqueTransactions.map(async (txn: any, idx: number) => {
        const amountMinor = Math.round(txn.amount * 100);
        const normalizedMerchant = txn.merchant.toLowerCase().trim();
        
        // Generate IDs
        const transactionId = await generateTransactionId({
          userId: user.id,
          batchId,
          postedDate: txn.date,
          amountMinor,
          normalizedMerchant,
          lineNumber: idx
        });
        
        const transactionHash = await generateTransactionHash({
          postedDate: txn.date,
          amountMinor,
          normalizedMerchant
        });
        
        // Check if this transaction was already processed
        const { data: existingTx } = await supabase
          .from('processed_transactions')
          .select('id, occurrence_count')
          .eq('user_id', user.id)
          .eq('transaction_hash', transactionHash)
          .maybeSingle();
        
        let isDuplicate = false;
        if (existingTx) {
          isDuplicate = true;
          // Update occurrence count
          await supabase
            .from('processed_transactions')
            .update({ 
              occurrence_count: existingTx.occurrence_count + 1,
              last_seen_at: new Date().toISOString()
            })
            .eq('id', existingTx.id);
        } else {
          // Store new transaction
          await supabase
            .from('processed_transactions')
            .insert({
              user_id: user.id,
              transaction_id: transactionId,
              transaction_hash: transactionHash,
              posted_date: txn.date,
              amount_minor: amountMinor,
              normalized_merchant: normalizedMerchant,
              category: txn.category
            });
        }
        
        return {
          ...txn,
          transaction_id: transactionId,
          transaction_hash: transactionHash,
          isDuplicate
        };
      })
    );

    console.log(`[extraction-success] ${enhancedTransactions.length} transactions, ${enhancedTransactions.filter(t => t.isDuplicate).length} duplicates detected`);

    return new Response(
      JSON.stringify({ 
        success: true,
        transactions: enhancedTransactions,
        batchId,
        metadata: {
          ...extracted.metadata,
          detectedFormat,
          processingTimeMs: processingTime,
          model: 'google/gemini-2.5-flash',
          extractedAt: new Date().toISOString(),
          duplicatesFound: enhancedTransactions.filter(t => t.isDuplicate).length
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('[extract-transactions] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Extraction failed' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
