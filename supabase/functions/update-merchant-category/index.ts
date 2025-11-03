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

    const { merchant, newCategory, confidence } = await req.json();
    
    console.log('[user-correction]', { 
      userId: user.id, 
      merchant, 
      newCategory 
    });

    // Update or insert merchant with user-verified category
    const { error } = await supabaseClient
      .from('merchant_intelligence')
      .upsert({
        merchant_raw: merchant.toLowerCase(),
        merchant_normalized: merchant,
        category: newCategory,
        confidence_score: confidence || 1.0,
        last_verified_at: new Date().toISOString(),
        merchant_type: 'user-corrected'
      }, {
        onConflict: 'merchant_raw'
      });

    if (error) {
      console.error('[update-error]', error);
      throw error;
    }

    console.log('[merchant-updated]', { merchant, newCategory });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[update-merchant-error]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
