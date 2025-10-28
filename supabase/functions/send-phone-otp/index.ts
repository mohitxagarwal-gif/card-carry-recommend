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
    const hashed_otp = await bcrypt.hash(otp_code);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    // Validate Twilio credentials are configured
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Send SMS via Twilio
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phone_e164,
          From: twilioPhoneNumber,
          Body: `Your Card Carry verification code is: ${otp_code}. Valid for 10 minutes. Do not share this code.`,
        }),
      }
    );

    if (!twilioResponse.ok) {
      const errorData = await twilioResponse.text();
      console.error(`[Twilio Error] Status: ${twilioResponse.status}, Response: ${errorData}`);
      throw new Error("Failed to send SMS verification code");
    }

    const twilioData = await twilioResponse.json();
    console.log(`SMS sent successfully. Message SID: ${twilioData.sid}`);

    const { error: insertError } = await supabase
      .from("phone_verifications")
      .insert({
        user_id: user.id,
        phone_e164,
        otp_code: hashed_otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    // Log OTP server-side only for development/debugging
    console.log(`OTP for ${phone_e164.replace(/\d(?=\d{4})/g, "*")}: ${otp_code}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error(`[${correlationId}] Error in send-phone-otp:`, error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ 
        error: "Unable to send verification code. Please try again.",
        correlationId 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
