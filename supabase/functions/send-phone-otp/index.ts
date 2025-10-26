import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { phone_e164 } = await req.json();

    if (!phone_e164 || !/^\+91[6-9]\d{9}$/.test(phone_e164)) {
      throw new Error("Invalid phone number format");
    }

    const { data: recentOtp } = await supabase
      .from("phone_verifications")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("phone_e164", phone_e164)
      .gte("created_at", new Date(Date.now() - 60000).toISOString())
      .single();

    if (recentOtp) {
      throw new Error("Please wait 60 seconds before requesting another OTP");
    }

    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: insertError } = await supabase
      .from("phone_verifications")
      .insert({
        user_id: user.id,
        phone_e164,
        otp_code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`OTP for ${phone_e164.replace(/\d(?=\d{4})/g, "*")}: ${otp_code}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        dev_otp: otp_code
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
