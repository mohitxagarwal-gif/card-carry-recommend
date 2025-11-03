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

const CATEGORY_OPTIONS = [
  "Food & Dining",
  "Shopping & E-commerce",
  "Transportation",
  "Utilities & Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Groceries",
  "Financial Services",
  "Travel",
  "Other"
];

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

    console.log(`[extract-transactions] Processing ${fileName} (${statementType}) for user ${user.id}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_AI_GATEWAY_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_AI_GATEWAY_KEY not configured");
    }

    const systemPrompt = `You are an expert at extracting transaction data from Indian bank and credit card statements.

CRITICAL RULES:
1. Extract ALL transactions from the entire document - do not skip any
2. Dates: Convert to DD/MM/YYYY format (15-Jan-2025 → 15/01/2025, 15/01/2025 stays as is)
3. Merchants: Clean and normalize names:
   - "AMAZONPAY*GROCERIES REF:12345" → "Amazon Pay"
   - "SWIGGY*ORDER*BANGALORE" → "Swiggy"
   - "UPI/PHONEPE-ZOMATO" → "Zomato"
   - "NEFT IMPS UPI/MERCHANT*ADDRESS*CITY" → "Merchant"
   - Remove: reference numbers (REF:, TXN:, ID:), transaction IDs, city names, timestamps, asterisks
   - Keep brand names clean and professional
4. Amounts: Extract as positive numbers in INR (₹2,450.00 → 2450.00, ignore commas)
5. Categories: Assign based on merchant AND transaction context:
   - Food & Dining: Swiggy, Zomato, restaurants, cafes, food delivery
   - Shopping & E-commerce: Amazon, Flipkart, Myntra, malls, online shopping
   - Transportation: Uber, Ola, fuel, petrol, diesel, tolls, metro, parking
   - Utilities & Bills: Electricity, mobile, broadband, DTH, gas, water
   - Entertainment: Netflix, Prime Video, Hotstar, movie tickets, Spotify, gaming
   - Healthcare: Pharmacies, Apollo, hospitals, doctors, medical
   - Education: Schools, colleges, courses, tuition, books
   - Groceries: BigBasket, Blinkit, Zepto, DMart, supermarkets, vegetables
   - Financial Services: Insurance, LIC, mutual funds, investments, loan EMI
   - Travel: Flights, hotels, IRCTC, MakeMyTrip, booking.com
   - Other: Only if truly unidentifiable

COMMON PATTERNS IN INDIAN STATEMENTS:
- Debit cards: Date | Description | Amount Dr/Cr | Balance
- Credit cards: Date | Description | Amount (often no currency symbol)
- Multi-line transactions: Merchant name may span 2-3 lines - combine them intelligently
- Indian number format: 1,23,456.00 (lakhs notation) or 123456.00
- Common prefixes: NEFT, IMPS, UPI, RTGS - remove these and extract actual merchant
- Withdrawal types: ATM, POS, e-commerce - focus on the merchant after these prefixes

IMPORTANT: Return ONLY valid transactions with amounts. Ignore:
- Opening/closing balance lines
- Interest charges or fees (unless specifically a transaction)
- Header/footer text
- Statement dates or account numbers

Return JSON only. No markdown formatting.`;

    const userPrompt = `Extract ALL transactions from this ${statementType} statement:

${pdfText}

Statement file: ${fileName}

Analyze the entire text carefully and extract every transaction with date, clean merchant name, amount, and appropriate category.`;

    const tools = [{
      type: "function",
      function: {
        name: "extract_transactions",
        description: "Extract structured transaction data from bank/credit card statement",
        parameters: {
          type: "object",
          properties: {
            transactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { 
                    type: "string", 
                    description: "Transaction date in DD/MM/YYYY format"
                  },
                  merchant: { 
                    type: "string",
                    description: "Cleaned merchant name, maximum 50 characters, no reference numbers"
                  },
                  amount: { 
                    type: "number",
                    description: "Transaction amount as positive number in INR"
                  },
                  category: { 
                    type: "string",
                    enum: CATEGORY_OPTIONS,
                    description: "Transaction category based on merchant and context"
                  }
                },
                required: ["date", "merchant", "amount", "category"]
              }
            },
            metadata: {
              type: "object",
              properties: {
                totalTransactions: { 
                  type: "number",
                  description: "Total number of transactions extracted"
                },
                dateRangeStart: { 
                  type: "string",
                  description: "Earliest transaction date in DD/MM/YYYY format"
                },
                dateRangeEnd: { 
                  type: "string",
                  description: "Latest transaction date in DD/MM/YYYY format"
                },
                statementFormat: { 
                  type: "string",
                  description: "Detected format: e.g. 'HDFC Credit Card', 'ICICI Bank', 'SBI'"
                }
              },
              required: ["totalTransactions", "dateRangeStart", "dateRangeEnd"]
            }
          },
          required: ["transactions", "metadata"]
        }
      }
    }];

    const startTime = Date.now();
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
        tool_choice: { type: "function", function: { name: "extract_transactions" } },
        temperature: 0.1
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            retryAfter: 30 
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'AI service payment required. Please contact support.' 
          }),
          { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status} ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const processingTime = Date.now() - startTime;

    if (!aiData.choices?.[0]?.message?.tool_calls?.[0]) {
      console.error('[extract-transactions] No tool call in AI response:', JSON.stringify(aiData));
      throw new Error('AI did not return structured data');
    }

    const toolCall = aiData.choices[0].message.tool_calls[0];
    const extracted = JSON.parse(toolCall.function.arguments);

    if (!extracted.transactions || extracted.transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No transactions found. The statement may be empty or in an unsupported format.',
          transactions: [],
          metadata: extracted.metadata || {}
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[extract-transactions] Success: ${extracted.transactions.length} transactions in ${processingTime}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        transactions: extracted.transactions,
        metadata: {
          ...extracted.metadata,
          processingTimeMs: processingTime,
          model: 'google/gemini-2.5-flash',
          extractedAt: new Date().toISOString()
        }
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('[extract-transactions] Error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid request data',
          details: error.errors 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to extract transactions. The statement format may not be readable.',
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
