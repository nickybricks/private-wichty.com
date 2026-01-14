import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_TAGS = [
  "hockey", "fussball", "volleyball", "basketball", "tennis", "padel",
  "schwimmen", "laufen", "fitness", "yoga", "tanzen",
  "musik", "kunst", "gaming", "networking", "workshop",
  "party", "outdoor", "wandern", "radfahren", "sonstiges"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, language = 'de' } = await req.json();

    if (!title || !description) {
      console.log('Missing title or description, skipping auto-tag');
      return new Response(
        JSON.stringify({ tag: null, message: 'Title and description required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ tag: 'sonstiges', message: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = language === 'de' 
      ? `Du bist ein Event-Kategorisierer. Analysiere den Event-Titel und die Beschreibung und gib GENAU EINEN passenden Tag aus dieser Liste zurück:
${VALID_TAGS.join(', ')}

Antworte NUR mit dem Tag-Namen, ohne zusätzlichen Text. Wenn nichts passt, antworte mit "sonstiges".`
      : `You are an event categorizer. Analyze the event title and description and return EXACTLY ONE matching tag from this list:
${VALID_TAGS.join(', ')}

Reply ONLY with the tag name, no additional text. If nothing matches, reply with "sonstiges".`;

    const userPrompt = `Title: ${title}\nDescription: ${description}`;

    console.log('Calling Lovable AI for auto-tagging...');
    console.log('Title:', title);
    console.log('Description:', description.substring(0, 100) + '...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded');
        return new Response(
          JSON.stringify({ tag: 'sonstiges', message: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error('Payment required');
        return new Response(
          JSON.stringify({ tag: 'sonstiges', message: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ tag: 'sonstiges', message: 'AI error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const rawTag = data.choices?.[0]?.message?.content?.trim().toLowerCase() || 'sonstiges';
    
    // Validate the tag is in our list
    const tag = VALID_TAGS.includes(rawTag) ? rawTag : 'sonstiges';
    
    console.log('Auto-tag result:', tag);

    return new Response(
      JSON.stringify({ tag }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-tag-event function:', error);
    return new Response(
      JSON.stringify({ tag: 'sonstiges', error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
