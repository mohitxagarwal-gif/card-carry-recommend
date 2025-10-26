import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailSummaryRequest {
  snapshotId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Resend API key exists
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact support." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const { snapshotId }: EmailSummaryRequest = await req.json();

    // Fetch snapshot and profile
    const [snapshotResult, profileResult] = await Promise.all([
      supabase
        .from("recommendation_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .single(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single(),
    ]);

    if (snapshotResult.error || !snapshotResult.data) {
      return new Response(
        JSON.stringify({ error: "Snapshot not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const snapshot = snapshotResult.data;
    const profile = profileResult.data;

    // Generate email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
            .savings { font-size: 24px; font-weight: bold; color: #10b981; margin: 20px 0; }
            .confidence { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase; }
            .confidence-high { background: #10b981; color: white; }
            .confidence-medium { background: #f59e0b; color: white; }
            .confidence-low { background: #ef4444; color: white; }
            .card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-style: italic;">card & carry.</h1>
              <p style="margin: 10px 0 0 0;">Your Credit Card Recommendations</p>
            </div>
            <div class="content">
              <h2>Hello ${profile?.full_name || 'there'}!</h2>
              <p>Here's a summary of your personalized credit card recommendations:</p>
              
              <div class="savings">
                ₹${snapshot.savings_min.toLocaleString('en-IN')} - ₹${snapshot.savings_max.toLocaleString('en-IN')}
                <br><small style="font-size: 14px; color: #666;">Estimated Annual Savings</small>
              </div>
              
              <p>
                Confidence Level: 
                <span class="confidence confidence-${snapshot.confidence}">
                  ${snapshot.confidence}
                </span>
              </p>
              
              <h3>Recommended Cards</h3>
              ${snapshot.recommended_cards.slice(0, 3).map((card: any) => `
                <div class="card">
                  <strong>${card.name || card.card_id}</strong>
                  ${card.issuer ? `<br><small>Issuer: ${card.issuer}</small>` : ''}
                </div>
              `).join('')}
              
              <p style="margin-top: 20px;">
                <a href="https://card-carry-recommend.lovable.app/recs" 
                   style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Full Recommendations
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email from Card & Carry.</p>
              <p>Please verify all card details with issuers before applying.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Card & Carry <onboarding@resend.dev>",
        to: [profile?.email || user.email],
        subject: "Your Card & Carry Recommendations",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendData = await resendResponse.json();
    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in email-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
