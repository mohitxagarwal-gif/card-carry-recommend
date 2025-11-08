import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeriveRequest {
  userId: string;
  spendData?: {
    monthlySpend: number;
    spendSplit: Record<string, number>;
  };
  analysisId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, spendData, analysisId } = await req.json() as DeriveRequest;

    console.log(`[derive-user-features] Starting for user ${userId}`);

    // 1. Fetch user profile and preferences
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch profile: ${profileError?.message}`);
    }

    const { data: prefs } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 2. Determine data source and calculate features
    let monthlySpendEstimate = 0;
    let spendSplit: Record<string, number> = {};
    let featureSource = 'self_report';
    let monthsCoverage = 0;
    let lastStmtEnd: string | null = null;
    let featureConfidence = 0.5;
    let transactionCount = 0;

    // Check if we have transaction data
    if (analysisId) {
      const { data: transactions, error: txError } = await supabaseClient
        .from('processed_transactions')
        .select('*')
        .eq('user_id', userId);

      if (transactions && transactions.length > 0) {
        console.log(`[derive-user-features] Found ${transactions.length} transactions`);
        
        // Calculate spend split from transactions
        const totalSpend = transactions.reduce((sum, t) => sum + t.amount_minor, 0);
        const categorySums: Record<string, number> = {};

        transactions.forEach(t => {
          const cat = t.category.toLowerCase();
          categorySums[cat] = (categorySums[cat] || 0) + t.amount_minor;
        });

        // Normalize to shares
        for (const [category, amount] of Object.entries(categorySums)) {
          spendSplit[category] = amount / totalSpend;
        }

        // Calculate monthly average
        const dates = transactions.map(t => new Date(t.posted_date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        monthsCoverage = Math.max(1, 
          (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
          (maxDate.getMonth() - minDate.getMonth()) + 1
        );

        monthlySpendEstimate = Math.round(totalSpend / monthsCoverage / 100); // Convert to major units
        lastStmtEnd = maxDate.toISOString().split('T')[0];
        featureSource = 'statements';
        transactionCount = transactions.length;
        
        // Higher confidence for statement-based data
        featureConfidence = Math.min(0.95, 0.6 + (monthsCoverage * 0.05));
        
        console.log(`[derive-user-features] Calculated from statements: ${monthlySpendEstimate}/mo over ${monthsCoverage} months`);
      }
    }

    // Fallback to self-reported data if no transactions
    if (featureSource === 'self_report' && spendData) {
      monthlySpendEstimate = spendData.monthlySpend;
      spendSplit = Object.fromEntries(
        Object.entries(spendData.spendSplit).map(([k, v]) => [k.toLowerCase(), v / 100])
      );
      featureConfidence = 0.6;
      console.log(`[derive-user-features] Using self-reported data: ${monthlySpendEstimate}/mo`);
    }

    // 3. Calculate derived features
    const pifScore = calculatePIFScore(profile.pay_in_full_habit);
    const feeToleranceMax = calculateFeeToleranceMax(prefs?.fee_tolerance_band);
    const acceptanceRiskAmex = calculateAmexRisk(profile.pincode, profile.city);

    // Normalize category shares
    const onlineShare = spendSplit['online'] || spendSplit['online shopping'] || 0;
    const diningShare = spendSplit['dining'] || spendSplit['food'] || 0;
    const groceriesShare = spendSplit['groceries'] || 0;
    const travelShare = spendSplit['travel'] || 0;
    const fuelShare = spendSplit['fuel'] || spendSplit['cabs_fuel'] || 0;
    const billsShare = spendSplit['bills'] || spendSplit['bills_utilities'] || spendSplit['utilities'] || 0;
    const entertainmentShare = spendSplit['entertainment'] || 0;
    const forexShare = spendSplit['forex'] || spendSplit['international'] || 0;

    // 4. Upsert to user_features
    const { error: featuresError } = await supabaseClient
      .from('user_features')
      .upsert({
        user_id: userId,
        monthly_spend_estimate: monthlySpendEstimate,
        spend_split_json: spendSplit,
        online_share: onlineShare,
        dining_share: diningShare,
        groceries_share: groceriesShare,
        travel_share: travelShare,
        cabs_fuel_share: fuelShare,
        bills_utilities_share: billsShare,
        entertainment_share: entertainmentShare,
        forex_share: forexShare,
        pif_score: pifScore,
        fee_tolerance_numeric: feeToleranceMax,
        acceptance_risk_amex: acceptanceRiskAmex,
        data_source: featureSource,
        months_coverage: monthsCoverage,
        last_statement_date: lastStmtEnd,
        feature_confidence: featureConfidence,
        transaction_count: transactionCount,
        updated_at: new Date().toISOString(),
      });

    if (featuresError) {
      console.error('[derive-user-features] Error upserting features:', featuresError);
      throw featuresError;
    }

    console.log(`[derive-user-features] Success! Confidence: ${featureConfidence.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        confidence: featureConfidence,
        source: featureSource,
        monthsCoverage,
        monthlySpend: monthlySpendEstimate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[derive-user-features] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper functions
function calculatePIFScore(habit: string | null): number {
  const mapping: Record<string, number> = { 
    'always': 1.0, 
    'mostly': 0.8, 
    'sometimes': 0.5, 
    'rarely': 0.3 
  };
  return mapping[habit || 'mostly'] || 0.8;
}

function calculateFeeToleranceMax(band: string | null): number {
  const mapping: Record<string, number> = { 
    'zero': 0, 
    '<=1k': 1000, 
    '<=5k': 5000, 
    'any_2x_roi': 999999 
  };
  return mapping[band || '<=5k'] || 5000;
}

function calculateAmexRisk(pincode: string | null, city: string | null): number {
  // Metro cities: lower Amex acceptance risk
  const metroCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];
  
  if (city && metroCities.some(m => city.toLowerCase().includes(m.toLowerCase()))) {
    return 0.2;
  }
  
  // Tier 2/3 cities: higher risk
  return 0.6;
}
