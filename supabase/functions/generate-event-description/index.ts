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

WICHTIGE FORMATIERUNGSREGELN:
- Nutze HTML-Tags für Formatierung: <b>fett</b>, <i>kursiv</i>, <u>unterstrichen</u>
- NIEMALS Markdown wie *text* oder **text** verwenden!
- Nutze <br> für Zeilenumbrüche zwischen Absätzen
- Nutze • am Zeilenanfang für Aufzählungspunkte, gefolgt von <br>
- Strukturiere den Text gut lesbar mit Absätzen

STIL:
- 3-5 kurze Absätze oder eine Mischung aus Fließtext und Aufzählung
- Freundlich und einladend
- Hebe wichtige Infos wie Zeit, Ort oder Highlights mit <b>fett</b> hervor`
      : `You are an event description assistant. Create engaging, inviting event descriptions in English.

IMPORTANT FORMATTING RULES:
- Use HTML tags for formatting: <b>bold</b>, <i>italic</i>, <u>underline</u>
- NEVER use Markdown like *text* or **text**!
- Use <br> for line breaks between paragraphs
- Use • at the start of lines for bullet points, followed by <br>
- Structure text with good readability using paragraphs

STYLE:
- 3-5 short paragraphs or a mix of prose and bullet points
- Friendly and inviting
- Highlight important info like time, location, or highlights with <b>bold</b>`;

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
    let generatedText = data.choices?.[0]?.message?.content || "";

    // Convert any remaining Markdown to HTML (fallback)
    generatedText = generatedText
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')  // **bold** to <b>
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')       // *italic* to <i>
      .replace(/__([^_]+)__/g, '<u>$1</u>')       // __underline__ to <u>
      .replace(/\n\n/g, '<br><br>')               // Double newlines to <br><br>
      .replace(/\n/g, '<br>');                    // Single newlines to <br>

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
