import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventName, location, date, existingText, language } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = language === "de" 
      ? `Du bist ein Event-Beschreibungs-Assistent. Erstelle ansprechende, einladende Event-Beschreibungen auf Deutsch. 
         Halte die Beschreibung zwischen 2-4 Sätzen. Sei freundlich und motivierend.
         Wenn der Nutzer bereits Text eingegeben hat, verbessere und erweitere diesen.
         Nutze Bullet Points (•) für wichtige Infos wenn sinnvoll.`
      : `You are an event description assistant. Create engaging, inviting event descriptions in English.
         Keep the description between 2-4 sentences. Be friendly and motivating.
         If the user has already entered text, improve and expand on it.
         Use bullet points (•) for key info when appropriate.`;

    const userPrompt = language === "de"
      ? `Erstelle eine Event-Beschreibung für:
         Event: ${eventName || "Unbenanntes Event"}
         ${location ? `Ort: ${location}` : ""}
         ${date ? `Datum: ${date}` : ""}
         ${existingText ? `Bisheriger Text: ${existingText}` : ""}`
      : `Create an event description for:
         Event: ${eventName || "Unnamed Event"}
         ${location ? `Location: ${location}` : ""}
         ${date ? `Date: ${date}` : ""}
         ${existingText ? `Existing text: ${existingText}` : ""}`;

    console.log("Generating description for:", { eventName, location, date, language });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    console.log("Generated description:", generatedText);

    return new Response(JSON.stringify({ description: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-event-description:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
