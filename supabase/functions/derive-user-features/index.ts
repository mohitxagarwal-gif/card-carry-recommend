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
  options?: {
    data_source?: 'statements' | 'self_report' | 'goal_based';
    pif_score?: number;
    fee_tolerance_numeric?: number;
    acceptance_risk_amex?: number;
    custom_weights?: Record<string, number>;
  };
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

    const { userId, spendData, analysisId, options } = await req.json() as DeriveRequest;

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

    // Apply smart defaults if no data available at all
    if (featureSource === 'self_report' && !spendData) {
      console.log(`[derive-user-features] No spending data, using smart defaults based on income`);
      
      // Estimate monthly spend based on income band
      const incomeDefaults: Record<string, number> = {
        '0-25000': 8000,
        '25000-50000': 15000,
        '50000-100000': 30000,
        '100000-200000': 60000,
        '200000+': 100000,
      };
      monthlySpendEstimate = incomeDefaults[profile.income_band_inr] || 30000;
      
      // Default category distribution for Indian consumers
      spendSplit = {
        'online': 0.25,
        'dining': 0.15,
        'groceries': 0.20,
        'bills': 0.15,
        'fuel': 0.10,
        'entertainment': 0.10,
        'travel': 0.05,
      };
      
      featureConfidence = 0.35; // Low confidence for defaults
      console.log(`[derive-user-features] Applied defaults: ${monthlySpendEstimate}/mo, confidence: ${featureConfidence}`);
    }

    // 3. Calculate derived features (with option overrides)
    const pifScore = options?.pif_score ?? calculatePIFScore(profile.pay_in_full_habit);
    
    // Map fee_sensitivity to fee_tolerance_numeric if fee_tolerance_band not set
    const feeToleranceMax = options?.fee_tolerance_numeric ?? (
      prefs?.fee_tolerance_band 
        ? calculateFeeToleranceMax(prefs.fee_tolerance_band)
        : mapFeeSensitivity(prefs?.fee_sensitivity, profile.income_band_inr)
    );
    
    const acceptanceRiskAmex = options?.acceptance_risk_amex ?? calculateAmexRisk(profile.pincode, profile.city);
    
    // Map new preference fields to numeric scores
    const travelNumeric = mapTravelFrequency(prefs?.travel_frequency);
    const loungeNumeric = mapLoungeImportance(prefs?.lounge_importance);
    const rewardPreference = prefs?.reward_preference || 'both';

    // Normalize category shares
    const onlineShare = spendSplit['online'] || spendSplit['online shopping'] || 0;
    const diningShare = spendSplit['dining'] || spendSplit['food'] || 0;
    const groceriesShare = spendSplit['groceries'] || 0;
    const travelShare = spendSplit['travel'] || 0;
    const fuelShare = spendSplit['fuel'] || spendSplit['cabs_fuel'] || 0;
    const billsShare = spendSplit['bills'] || spendSplit['bills_utilities'] || spendSplit['utilities'] || 0;
    const entertainmentShare = spendSplit['entertainment'] || 0;
    const forexShare = spendSplit['forex'] || spendSplit['international'] || 0;

    // Override data_source if provided in options
    if (options?.data_source) {
      featureSource = options.data_source;
    }
    
    // Calculate feature confidence based on source + completeness
    if (options?.data_source === 'goal_based') {
      featureConfidence = 0.5; // Medium confidence for goal-based
    } else if (options?.data_source === 'self_report') {
      // Base 0.5, increase with completeness
      const hasSpendData = !!spendData;
      const hasPreferences = !!(prefs?.fee_tolerance_band || prefs?.travel_frequency);
      const completeness = (hasSpendData ? 0.5 : 0) + (hasPreferences ? 0.5 : 0);
      featureConfidence = 0.5 * (0.6 + 0.4 * completeness);
    }
    
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
        travel_numeric: travelNumeric,
        lounge_numeric: loungeNumeric,
        reward_preference: rewardPreference,
        data_source: featureSource,
        months_coverage: monthsCoverage,
        last_statement_date: lastStmtEnd,
        feature_confidence: featureConfidence,
        transaction_count: transactionCount,
        custom_weights: options?.custom_weights || null,
        updated_at: new Date().toISOString(),
      });

    if (featuresError) {
      console.error('[derive-user-features] Error upserting features:', featuresError);
      throw new Error(`Database error: ${featuresError.message}`);
    }

    console.log(`[derive-user-features] ✅ Success! Confidence: ${featureConfidence.toFixed(2)}, Source: ${featureSource}, Monthly Spend: ₹${monthlySpendEstimate}`);

    return new Response(
      JSON.stringify({
        success: true,
        confidence: featureConfidence,
        source: featureSource,
        monthsCoverage,
        monthlySpend: monthlySpendEstimate,
        message: 'User features derived and saved successfully'
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

// Map fee_sensitivity to fee_tolerance_numeric based on income
function mapFeeSensitivity(sensitivity: string | null, incomeBand: string | null): number {
  const incomeMultipliers: Record<string, number> = {
    '0-25000': 500,
    '25000-50000': 1000,
    '50000-100000': 2500,
    '100000-200000': 5000,
    '200000+': 10000,
  };
  
  const base = incomeMultipliers[incomeBand || '50000-100000'] || 2500;
  
  switch (sensitivity) {
    case 'low': return base * 2;      // Willing to pay higher fees
    case 'high': return base * 0.3;   // Very fee-conscious
    default: return base;             // Medium - standard tolerance
  }
}

// Map travel_frequency to travel_numeric (0-10)
function mapTravelFrequency(frequency: string | null): number {
  const mapping: Record<string, number> = {
    'rarely': 2,
    'occasional': 5,
    'frequent': 8,
  };
  return mapping[frequency || 'occasional'] || 5;
}

// Map lounge_importance to lounge_numeric (0-10)
function mapLoungeImportance(importance: string | null): number {
  const mapping: Record<string, number> = {
    'not_important': 2,
    'nice_to_have': 5,
    'very_important': 9,
  };
  return mapping[importance || 'nice_to_have'] || 5;
}
