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
    const { files, context } = await req.json();
    const fileSummary = Array.isArray(files)
      ? files.map((f: any) => `${f.type}:${f.name}`).join(", ")
      : "none";

    const prompt = `You are an agronomy assistant. You receive uploaded field assets (imagery and CSV sensor data).\n\n` +
      `Files: ${fileSummary}.\n` +
      `${context ? `Context: ${context}\n` : ""}` +
      `Analyze likely vegetation stress, irrigation/fertilizer opportunities, and data issues.\n` +
      `Return a concise, readable summary. At the end, include a JSON block with keys: summary (string), risks (array of strings), actions (array of strings).`;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: prompt }] },
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
    console.error("gemini-analyze error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});