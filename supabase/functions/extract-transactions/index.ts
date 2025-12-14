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
  statementType: z.enum(['credit_card', 'bank', 'unknown']).default('unknown'),
  stream: z.boolean().default(false)
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
    const { pdfText, fileName, statementType, stream } = validatedData;
    const batchId = `batch_${Date.now()}`;

    const startTime = Date.now();
    console.log(`[extract-transactions] Processing ${fileName} (${statementType}) for user ${user.id}`, {
      textLength: pdfText.length,
      timestamp: new Date().toISOString(),
      batchId,
      streaming: stream
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

    // PHASE 1 OPTIMIZATION: Use gemini-2.5-flash-lite for faster extraction
    // It's ~2x faster with comparable accuracy for structured extraction tasks
    const model = 'google/gemini-2.5-flash-lite';
    
    // PHASE 1: Simplified prompt for faster processing
    const systemPrompt = `Extract transactions from this Indian bank/credit card statement.

RULES:
1. Dates: YYYY-MM-DD format
2. Type: debit (money out) or credit (money in)
3. Merchants: Clean names only
4. Amounts: Positive numbers in INR
5. Categories: ${STANDARD_CATEGORIES.join(', ')}

Return JSON only.`;

    // PHASE 1: Truncate very long PDFs for speed (keep first 100KB)
    const maxTextLength = 100000;
    const truncatedText = pdfText.length > maxTextLength 
      ? pdfText.substring(0, maxTextLength) + '\n[...truncated for processing speed...]'
      : pdfText;

    const userPrompt = `Extract ALL transactions:\n\n${truncatedText}`;

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
                  date: { type: "string", description: "YYYY-MM-DD" },
                  merchant: { type: "string", description: "Merchant name" },
                  amount: { type: "number", description: "Amount in INR" },
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
                dateRangeEnd: { type: "string" }
              },
              required: ["totalTransactions", "dateRangeStart", "dateRangeEnd"]
            }
          },
          required: ["transactions", "metadata"]
        }
      }
    }];

    console.log(`[ai-request-start] Model: ${model}, text length: ${truncatedText.length}`);
    
    // PHASE 1: Add timeout with AbortController (30s timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    let aiResponse;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools,
          tool_choice: { type: "function", function: { name: "extract_transactions" } }
        }),
        signal: controller.signal
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.error('[ai-timeout] Request timed out after 30s');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Extraction timed out. Please try a smaller statement.',
            suggestion: 'Try uploading just 1 month of statements at a time.'
          }),
          { status: 408, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

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
    
    console.log(`[ai-response] Completed in ${processingTime}ms`);
    
    if (!aiData.choices?.[0]?.message?.tool_calls?.[0]) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI could not extract data' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const toolCall = aiData.choices[0].message.tool_calls[0];
    const extracted = JSON.parse(toolCall.function.arguments);

    // Deduplicate transactions
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

    // PHASE 1: Batch database operations (already optimized)
    console.log('[batch-optimization] Generating hashes for all transactions in memory...');
    
    const transactionsWithHashes = await Promise.all(
      uniqueTransactions.map(async (txn: any, idx: number) => {
        const amountMinor = Math.round(txn.amount * 100);
        const normalizedMerchant = txn.merchant.toLowerCase().trim();
        
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
        
        return {
          ...txn,
          transaction_id: transactionId,
          transaction_hash: transactionHash,
          amount_minor: amountMinor,
          normalized_merchant: normalizedMerchant
        };
      })
    );

    // Single batch lookup for existing transactions
    console.log('[batch-optimization] Batch lookup for existing transactions...');
    const hashes = transactionsWithHashes.map(t => t.transaction_hash);
    const { data: existingTxs } = await supabase
      .from('processed_transactions')
      .select('transaction_hash, id, occurrence_count')
      .eq('user_id', user.id)
      .in('transaction_hash', hashes);
    
    const existingMap = new Map(existingTxs?.map(t => [t.transaction_hash, t]) || []);
    
    // Separate new vs existing
    const newTransactions: any[] = [];
    const updateTransactions: any[] = [];
    const enhancedTransactions = transactionsWithHashes.map(txn => {
      const existing = existingMap.get(txn.transaction_hash);
      if (existing) {
        updateTransactions.push(existing);
        return { ...txn, isDuplicate: true };
      } else {
        newTransactions.push({
          user_id: user.id,
          transaction_id: txn.transaction_id,
          transaction_hash: txn.transaction_hash,
          posted_date: txn.date,
          amount_minor: txn.amount_minor,
          normalized_merchant: txn.normalized_merchant,
          category: txn.category
        });
        return { ...txn, isDuplicate: false };
      }
    });

    // Single batch insert for new transactions
    if (newTransactions.length > 0) {
      console.log(`[batch-optimization] Inserting ${newTransactions.length} new transactions in one call...`);
      const { error: insertError } = await supabase
        .from('processed_transactions')
        .insert(newTransactions);
      
      if (insertError) {
        console.error('[batch-optimization] Batch insert error:', insertError);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[extraction-success] ${enhancedTransactions.length} transactions, ${updateTransactions.length} duplicates, total time: ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        transactions: enhancedTransactions,
        batchId,
        metadata: {
          ...extracted.metadata,
          detectedFormat,
          processingTimeMs: totalTime,
          aiTimeMs: processingTime,
          model,
          extractedAt: new Date().toISOString(),
          duplicatesFound: updateTransactions.length,
          textTruncated: pdfText.length > maxTextLength,
          optimization: 'flash_lite_model'
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
