import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const SendOtpSchema = z.object({
  phone_e164: z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid Indian phone number format")
});

// Helper function to hash OTP using native crypto API
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    const body = await req.json();
    const { phone_e164 } = SendOtpSchema.parse(body);

    // Check daily quota (max 5 OTPs per user per day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayOtps, error: countError } = await supabase
      .from('phone_verifications')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString());

    if (todayOtps && todayOtps.length >= 5) {
      throw new Error('Daily OTP limit reached. Please try again tomorrow.');
    }

    // Check rate limiting (60 seconds between requests)
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
    const hashed_otp = await hashOtp(otp_code);

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
    
    // Return user-friendly error message (no correlation ID exposed)
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unable to send verification code. Please try again."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
