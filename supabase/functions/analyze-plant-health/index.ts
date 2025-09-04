import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const apiKey = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, context } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: "Missing image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt = `You are an expert agricultural scientist and plant pathologist. Analyze this image for plant and soil health indicators.

${context || "Analyze this image for signs of plant diseases, nutrient deficiencies, pest damage, soil quality, and overall plant health."}

Provide a detailed assessment including:
1. Overall health status (healthy, stressed, diseased)
2. Specific issues identified (if any)
3. Possible causes and recommendations
4. Confidence level of your assessment

At the end, include a JSON block with:
- status: "healthy" | "stressed" | "diseased" | "unknown"
- issues: array of identified problems
- recommendations: array of actionable advice
- confidence: percentage (0-100)`;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { 
              role: "user", 
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data
                  }
                }
              ] 
            },
          ],
        }),
      },
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: unknown = null;
    try {
      const match = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/\{[\s\S]*\}$/);
      if (match) {
        const jsonStr = match[1] ?? match[0];
        parsed = JSON.parse(jsonStr);
      }
    } catch (_) {
      // ignore JSON parse errors, we'll just return text
    }

    return new Response(
      JSON.stringify({ text, json: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("analyze-plant-health error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});