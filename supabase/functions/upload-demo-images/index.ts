import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Image URLs from the generated assets (these are base64 data URLs that need to be uploaded)
const DEMO_IMAGES = [
  { name: "hockey-tournament.jpg", eventId: "a1b2c3d4-0001-4000-8000-000000000001" },
  { name: "tennis-mixed.jpg", eventId: "a1b2c3d4-0002-4000-8000-000000000002" },
  { name: "golf-beginner.jpg", eventId: "a1b2c3d4-0003-4000-8000-000000000003" },
  { name: "hockey-bundesliga.jpg", eventId: "a1b2c3d4-0004-4000-8000-000000000004" },
  { name: "tennis-tournament.jpg", eventId: "a1b2c3d4-0005-4000-8000-000000000005" },
  { name: "golf-charity.jpg", eventId: "a1b2c3d4-0006-4000-8000-000000000006" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { images } = await req.json();
    
    if (!images || !Array.isArray(images)) {
      throw new Error("Images array required");
    }

    const results = [];

    for (const img of images) {
      const { name, base64Data } = img;
      
      // Convert base64 to Uint8Array
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to storage
      const { data, error } = await supabase.storage
        .from("event-images")
        .upload(`demo/${name}`, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error(`Error uploading ${name}:`, error);
        results.push({ name, error: error.message });
      } else {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/event-images/demo/${name}`;
        results.push({ name, url: publicUrl, success: true });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
