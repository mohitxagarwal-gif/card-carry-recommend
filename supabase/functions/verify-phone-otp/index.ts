import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

    const { phone_e164, otp_code } = await req.json();

    if (!phone_e164 || !otp_code) {
      throw new Error("Missing phone number or OTP code");
    }

    // Find the most recent unverified OTP for this user and phone
    const { data: verification, error: findError } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("phone_e164", phone_e164)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !verification) {
      throw new Error("Invalid or expired OTP");
    }

    // Compare submitted OTP with hashed OTP
    const isValidOtp = await bcrypt.compare(otp_code, verification.otp_code);
    
    if (!isValidOtp) {
      throw new Error("Invalid or expired OTP");
    }

    const { error: updateError } = await supabase
      .from("phone_verifications")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", verification.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Phone number verified successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Error in verify-phone-otp:`, error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ 
        error: "Verification failed. Please check your code and try again.",
        correlationId 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
