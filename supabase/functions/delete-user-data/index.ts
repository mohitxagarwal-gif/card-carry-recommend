import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role key for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Use anon key to verify user
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Deleting data for user: ${user.id}`);

    // Delete user data from all tables (RLS policies ensure they can only delete their own data)
    // Using service role key to bypass RLS for comprehensive deletion
    const deletionResults = await Promise.allSettled([
      supabaseAdmin.from("recommendation_snapshots").delete().eq("user_id", user.id),
      supabaseAdmin.from("user_shortlist").delete().eq("user_id", user.id),
      supabaseAdmin.from("card_applications").delete().eq("user_id", user.id),
      supabaseAdmin.from("user_cards").delete().eq("user_id", user.id),
      supabaseAdmin.from("fee_waiver_goals").delete().eq("user_id", user.id),
      supabaseAdmin.from("user_reminders").delete().eq("user_id", user.id),
      supabaseAdmin.from("user_preferences").delete().eq("user_id", user.id),
      supabaseAdmin.from("spending_analyses").delete().eq("user_id", user.id),
      supabaseAdmin.from("phone_verifications").delete().eq("user_id", user.id),
      supabaseAdmin.from("profiles").delete().eq("id", user.id),
    ]);

    // Log any failures
    deletionResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Deletion failed for table ${index}:`, result.reason);
      }
    });

    // Delete auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully deleted user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User data and account deleted successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user-data function:", error);
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
