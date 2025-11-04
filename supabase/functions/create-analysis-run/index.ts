// Phase 2: Create analysis run snapshot
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { batchId, transactions, periodStart, periodEnd } = await req.json();

    if (!batchId || !Array.isArray(transactions)) {
      return new Response(JSON.stringify({ error: 'Invalid request: batchId and transactions required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract transaction IDs
    const transactionIds = transactions.map(t => t.transaction_id || t.id).filter(Boolean);
    const transactionCount = transactionIds.length;

    console.log(`Creating analysis run for user ${user.id}, batch ${batchId}, ${transactionCount} transactions`);

    // Create analysis run snapshot
    const { data: analysisRun, error: insertError } = await supabaseClient
      .from('analysis_runs')
      .insert({
        user_id: user.id,
        batch_id: batchId,
        transaction_ids: transactionIds,
        transaction_count: transactionCount,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating analysis run:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Analysis run created: ${analysisRun.id}`);

    return new Response(JSON.stringify({
      analysisRunId: analysisRun.id,
      batchId: analysisRun.batch_id,
      transactionIds: analysisRun.transaction_ids,
      transactionCount: analysisRun.transaction_count
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-analysis-run:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
