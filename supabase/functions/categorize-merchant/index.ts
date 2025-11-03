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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const body = await req.json();
    const { 
      merchantName, 
      amount, 
      transactionType, 
      date, 
      recentTransactions 
    } = body;
    
    if (!merchantName || typeof merchantName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid merchant name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedName = merchantName.toLowerCase().trim();
    console.log('[categorize-start]', { 
      merchantName, 
      normalizedName,
      amount,
      transactionType
    });

    // STEP 1: Exact match lookup
    const { data: exactMatch } = await supabaseClient
      .from('merchant_intelligence')
      .select('*')
      .ilike('merchant_raw', normalizedName)
      .limit(1)
      .single();

    if (exactMatch) {
      console.log('[exact-match-found]', { merchant: exactMatch.merchant_canonical });
      
      // Update usage stats
      await supabaseClient
        .from('merchant_intelligence')
        .update({
          transaction_count: exactMatch.transaction_count + 1,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', exactMatch.id);

      return new Response(
        JSON.stringify({
          category: exactMatch.category,
          subcategory: exactMatch.subcategory,
          merchant_normalized: exactMatch.merchant_normalized,
          merchant_canonical: exactMatch.merchant_canonical,
          confidence: exactMatch.confidence_score,
          source: 'database-exact'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 2: Fuzzy match using keywords/aliases
    const { data: fuzzyMatches } = await supabaseClient
      .from('merchant_intelligence')
      .select('*')
      .or(`keywords.cs.{${normalizedName}},merchant_normalized.ilike.%${normalizedName}%`)
      .limit(5);

    if (fuzzyMatches && fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      console.log('[fuzzy-match-found]', { 
        merchant: bestMatch.merchant_canonical, 
        matches: fuzzyMatches.length 
      });

      // Update usage stats for fuzzy match
      await supabaseClient
        .from('merchant_intelligence')
        .update({
          transaction_count: bestMatch.transaction_count + 1,
          last_seen_at: new Date().toISOString()
        })
        .eq('id', bestMatch.id);

      return new Response(
        JSON.stringify({
          category: bestMatch.category,
          subcategory: bestMatch.subcategory,
          merchant_normalized: bestMatch.merchant_normalized,
          merchant_canonical: bestMatch.merchant_canonical,
          confidence: bestMatch.confidence_score * 0.8,
          source: 'database-fuzzy'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: AI-powered categorization with enhanced context
    console.log('[ai-categorize-needed]', { 
      merchant: normalizedName,
      amount,
      transactionType,
      hasContext: !!recentTransactions 
    });
    
    // Build context string
    let contextStr = '';
    if (amount !== undefined) {
      contextStr += `\nTransaction Amount: ₹${amount.toLocaleString('en-IN')}`;
    }
    if (transactionType) {
      contextStr += `\nTransaction Type: ${transactionType} (${transactionType === 'debit' ? 'money spent' : 'money received'})`;
    }
    if (date) {
      contextStr += `\nDate: ${date}`;
    }
    if (recentTransactions && recentTransactions.length > 0) {
      contextStr += `\n\nRecent Transaction Context:`;
      recentTransactions.forEach((t: any) => {
        contextStr += `\n- ${t.merchant}: ₹${t.amount} (${t.category})`;
      });
    }
    
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
        messages: [{
          role: 'system',
          content: `You are a merchant categorization expert for Indian transactions. 

Categories: Food & Dining, Shopping & E-commerce, Transportation, Utilities & Bills, Entertainment, Healthcare, Education, Groceries, Financial Services, Travel, Other

IMPORTANT CONTEXT RULES:
- Small amounts (₹50-500) at food merchants = likely snacks/quick meals
- Medium amounts (₹500-2000) at food merchants = full meals/group orders
- Very small amounts (₹10-100) at any merchant = likely micro-transactions, tips, or testing
- Recurring merchants (appear in recent context) = subscriptions or regular purchases
- Transaction type "credit" for refunds/cashback should still be categorized by merchant type
- Amount context helps: ₹5000+ at Amazon could be electronics, ₹200-1000 is general shopping

Return ONLY a JSON object:
{
  "category": "one of the categories above",
  "subcategory": "more specific type (e.g., 'Quick Commerce' for Groceries, 'Restaurant Dining' for Food)",
  "merchant_normalized": "cleaned merchant name",
  "confidence": 0.0-1.0 (lower if merchant is generic or unclear),
  "reasoning": "brief explanation"
}

Common Indian merchants by category:
- Food & Dining: Swiggy, Zomato, McDonald's, KFC, Domino's, Starbucks, local restaurants
- Shopping & E-commerce: Amazon, Flipkart, Myntra, Ajio, Nykaa, Meesho
- Groceries: Zepto, Blinkit (formerly Grofers), BigBasket, Swiggy Instamart, DMart
- Transportation: Uber, Ola, Rapido, Bounce, BMTC, Delhi Metro, parking
- Entertainment: Netflix, Prime Video, Hotstar, Spotify, BookMyShow, gaming
- Utilities & Bills: Airtel, Jio, Vi (Vodafone Idea), BSNL, electricity boards, gas
- Financial Services: PhonePe, Paytm, Google Pay, insurance, mutual funds
- Healthcare: Apollo, Practo, 1mg, PharmEasy, hospitals, clinics
- Education: Coursera, Udemy, Byju's, Unacademy, school fees
- Travel: MakeMyTrip, Goibibo, IRCTC, OYO, hotels, airlines

Use "other" category ONLY as absolute last resort when merchant is truly unidentifiable.`
        }, {
          role: 'user',
          content: `Categorize this merchant: "${merchantName}"${contextStr}`
        }],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      console.error('[ai-error]', { status: aiResponse.status });
      throw new Error('AI categorization failed');
    }

    const aiData = await aiResponse.json();
    const aiResult = JSON.parse(
      aiData.choices[0].message.content.replace(/```json\n?|\n?```/g, '')
    );

    console.log('[ai-categorized]', { 
      merchant: merchantName, 
      category: aiResult.category,
      confidence: aiResult.confidence 
    });

    // STEP 4: Store AI result in database for future use (if confidence > 0.7)
    if (aiResult.confidence >= 0.7) {
      await supabaseClient
        .from('merchant_intelligence')
        .insert({
          merchant_raw: normalizedName,
          merchant_normalized: aiResult.merchant_normalized,
          category: aiResult.category,
          subcategory: aiResult.subcategory,
          confidence_score: aiResult.confidence,
          merchant_type: 'ai-learned',
          keywords: [normalizedName, ...aiResult.merchant_normalized.toLowerCase().split(' ')],
          last_verified_at: new Date().toISOString()
        });

      console.log('[merchant-learned]', { merchant: aiResult.merchant_normalized });
    }

    return new Response(
      JSON.stringify({
        ...aiResult,
        source: 'ai-powered'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[categorize-error]', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        category: 'other',
        confidence: 0.0
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
