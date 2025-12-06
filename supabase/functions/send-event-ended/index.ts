import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface EndedEvent {
  id: string;
  name: string;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-EVENT-ENDED] Starting event ended summary job...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    console.log("[SEND-EVENT-ENDED] Checking for events that ended before:", today, currentTime);

    // Find events that have ended:
    // 1. Event date is before today, OR
    // 2. Event date is today AND end_time/event_time has passed
    // 3. Status is 'active' (meaning the event was running)
    // 4. Haven't sent the ended notification yet (we'll track this by setting status to 'completed')
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, name, event_date, event_time, end_time, location, user_id")
      .eq("status", "active")
      .or(`event_date.lt.${today},and(event_date.eq.${today},end_time.lte.${currentTime}),and(event_date.eq.${today},end_time.is.null,event_time.lte.${currentTime})`);

    if (eventsError) {
      console.error("[SEND-EVENT-ENDED] Error fetching events:", eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log("[SEND-EVENT-ENDED] No events have ended");
      return new Response(
        JSON.stringify({ success: true, message: "No events ended", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[SEND-EVENT-ENDED] Found ${events.length} ended events to process`);

    let totalNotificationsSent = 0;

    for (const event of events as EndedEvent[]) {
      console.log(`[SEND-EVENT-ENDED] Processing event: ${event.name} (${event.id})`);

      // Get participant count
      const { count: participantCount, error: participantCountError } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id);

      if (participantCountError) {
        console.error(`[SEND-EVENT-ENDED] Error counting participants for ${event.id}:`, participantCountError);
      }

      // Get check-in count
      const { count: checkedInCount, error: checkedInError } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .not("checked_in_at", "is", null);

      if (checkedInError) {
        console.error(`[SEND-EVENT-ENDED] Error counting check-ins for ${event.id}:`, checkedInError);
      }

      const eventUrl = `https://wichty.com/event/${event.id}`;

      // Get host profile and send notification
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, language, notify_organizing")
        .eq("id", event.user_id)
        .single();

      if (hostProfile?.notify_organizing !== false) {
        const hostName = hostProfile?.first_name || hostProfile?.display_name || "Host";
        const hostLanguage = hostProfile?.language === "en" ? "en" : "de";

        console.log(`[SEND-EVENT-ENDED] Sending summary: ${participantCount || 0} participants, ${checkedInCount || 0} checked in`);

        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "event_ended",
            recipientUserId: event.user_id,
            recipientName: hostName,
            language: hostLanguage,
            eventName: event.name,
            eventDate: event.event_date,
            eventTime: event.event_time,
            eventLocation: event.location,
            eventUrl,
            participantCount: participantCount || 0,
            checkedInCount: checkedInCount || 0,
          }),
        });

        if (response.ok) {
          totalNotificationsSent++;
          console.log(`[SEND-EVENT-ENDED] Sent event ended summary for ${event.name}`);
        } else {
          const errorText = await response.text();
          console.error(`[SEND-EVENT-ENDED] Failed to send summary for ${event.name}:`, errorText);
        }
      }

      // Mark event as completed
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", event.id);

      if (updateError) {
        console.error(`[SEND-EVENT-ENDED] Error updating status for ${event.id}:`, updateError);
      } else {
        console.log(`[SEND-EVENT-ENDED] Marked event ${event.id} as completed`);
      }
    }

    console.log(`[SEND-EVENT-ENDED] Job complete. Sent ${totalNotificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        notificationsSent: totalNotificationsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("[SEND-EVENT-ENDED] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
