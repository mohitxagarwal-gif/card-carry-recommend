import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { messages } = await req.json();
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build conversation context
    const conversationLength = messages.filter((m: any) => m.role === "user").length;
    
    // System prompt for goal extraction
    const systemPrompt = `You are a credit card advisor helping users define their spending goals.

Your task:
1. Ask clarifying questions about their spending habits (2-3 questions max)
2. Once you have enough info, extract:
   - Monthly spend estimate (₹10,000 - ₹200,000)
   - Spending breakdown by category (should sum to 100%)
   - Priority focus (travel, cashback, dining, etc.)
   - Fee sensitivity (low/medium/high)

Categories: travel, dining, groceries, online, entertainment, fuel, forex, bills, other

After 2-3 exchanges, if you have enough info, respond with:
"Perfect! I've got a clear picture. Let me find the best cards for you."

Then call the extract_goal_data function with the extracted information.

Keep responses friendly, brief (2-3 sentences max), and focused on gathering spending patterns.`;

    // Make AI call
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_goal_data",
              description: "Extract structured goal data from conversation",
              parameters: {
                type: "object",
                properties: {
                  monthlySpend: {
                    type: "number",
                    description: "Estimated monthly spending in INR",
                  },
                  spendSplit: {
                    type: "object",
                    description: "Percentage breakdown by category (must sum to ~100)",
                    properties: {
                      travel: { type: "number" },
                      dining: { type: "number" },
                      groceries: { type: "number" },
                      online: { type: "number" },
                      entertainment: { type: "number" },
                      fuel: { type: "number" },
                      forex: { type: "number" },
                      bills: { type: "number" },
                      other: { type: "number" },
                    },
                  },
                  priorityCategories: {
                    type: "array",
                    items: { type: "string" },
                    description: "Top 2-3 priority categories",
                  },
                  feeSensitivity: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "How sensitive to annual fees",
                  },
                  goalDescription: {
                    type: "string",
                    description: "One sentence summary of user's goal",
                  },
                },
                required: ["monthlySpend", "spendSplit", "priorityCategories", "feeSensitivity", "goalDescription"],
              },
            },
          },
        ],
        tool_choice: conversationLength >= 2 ? { type: "function", function: { name: "extract_goal_data" } } : "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    // Check if function was called
    if (choice?.message?.tool_calls?.[0]) {
      const toolCall = choice.message.tool_calls[0];
      const goalData = JSON.parse(toolCall.function.arguments);

      // Normalize spend split
      const splitTotal = Object.values(goalData.spendSplit).reduce((sum: number, val: any) => sum + (val || 0), 0);
      const normalizedSplit = Object.fromEntries(
        Object.entries(goalData.spendSplit).map(([k, v]) => [k, (v as number) / splitTotal])
      );

      // Build custom weights based on priorities
      const customWeights: Record<string, number> = {
        categoryAlignment: 0.35,
        rewardRelevance: 0.25,
        feeAffordability: goalData.feeSensitivity === "high" ? 0.25 : 0.15,
        travelFit: goalData.priorityCategories.includes("travel") ? 0.20 : 0.10,
        networkAcceptance: 0.05,
      };

      return new Response(
        JSON.stringify({
          response: choice.message.content || "Perfect! I've got a clear picture. Let me find the best cards for you.",
          goalData: {
            monthlySpend: goalData.monthlySpend,
            spendSplit: normalizedSplit,
            customWeights,
            goalDescription: goalData.goalDescription,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Continue conversation
    return new Response(
      JSON.stringify({
        response: choice?.message?.content || "Could you tell me more about your spending habits?",
        goalData: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Goal chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
