import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface EventToRemind {
  id: string;
  name: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  user_id: string;
}

interface Participant {
  id: string;
  name: string;
  user_id: string | null;
}

interface Ticket {
  ticket_code: string;
  participant_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SEND-EVENT-REMINDERS] Starting reminder job...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Calculate the time window: events happening in the next 11-13 hours
    // This gives us a 2-hour window to catch events even if cron runs late
    const now = new Date();
    const hoursAhead = 12;
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    const targetDate = targetTime.toISOString().split("T")[0];

    console.log("[SEND-EVENT-REMINDERS] Looking for events on:", targetDate);

    // Get events that:
    // 1. Are on the target date (12 hours from now)
    // 2. Haven't had reminders sent yet
    // 3. Have status 'waiting' or 'active'
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, name, event_date, event_time, location, user_id")
      .eq("event_date", targetDate)
      .is("reminder_sent_at", null)
      .in("status", ["waiting", "active"]);

    if (eventsError) {
      console.error("[SEND-EVENT-REMINDERS] Error fetching events:", eventsError);
      throw eventsError;
    }

    if (!events || events.length === 0) {
      console.log("[SEND-EVENT-REMINDERS] No events to remind about");
      return new Response(
        JSON.stringify({ success: true, message: "No events to remind", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[SEND-EVENT-REMINDERS] Found ${events.length} events to process`);

    let totalNotificationsSent = 0;

    for (const event of events as EventToRemind[]) {
      console.log(`[SEND-EVENT-REMINDERS] Processing event: ${event.name} (${event.id})`);

      // Get all participants for this event
      const { data: participants, error: participantsError } = await supabase
        .from("participants")
        .select("id, name, user_id")
        .eq("event_id", event.id);

      if (participantsError) {
        console.error(`[SEND-EVENT-REMINDERS] Error fetching participants for ${event.id}:`, participantsError);
        continue;
      }

      // Get tickets for participants to include ticket URLs
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("ticket_code, participant_id")
        .eq("event_id", event.id);

      if (ticketsError) {
        console.error(`[SEND-EVENT-REMINDERS] Error fetching tickets for ${event.id}:`, ticketsError);
      }

      const ticketMap = new Map<string, string>();
      if (tickets) {
        for (const ticket of tickets as Ticket[]) {
          ticketMap.set(ticket.participant_id, ticket.ticket_code);
        }
      }

      const eventUrl = `https://wichty.com/event/${event.id}`;
      const participantCount = participants?.length || 0;

      // Send reminder to each participant (guest)
      if (participants && participants.length > 0) {
        for (const participant of participants as Participant[]) {
          if (!participant.user_id) continue;

          const ticketCode = ticketMap.get(participant.id);
          const ticketUrl = ticketCode ? `https://wichty.com/ticket/${ticketCode}` : undefined;

          // Get participant's preferred language from their profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("language")
            .eq("id", participant.user_id)
            .single();

          const language = profile?.language === "en" ? "en" : "de";

          // Send guest reminder
          const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: "event_reminder_guest",
              recipientUserId: participant.user_id,
              recipientName: participant.name,
              language,
              eventName: event.name,
              eventDate: event.event_date,
              eventTime: event.event_time,
              eventLocation: event.location,
              eventUrl,
              ticketUrl,
            }),
          });

          if (response.ok) {
            totalNotificationsSent++;
            console.log(`[SEND-EVENT-REMINDERS] Sent guest reminder to ${participant.name}`);
          } else {
            console.error(`[SEND-EVENT-REMINDERS] Failed to send guest reminder to ${participant.name}`);
          }
        }
      }

      // Send reminder to host
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, language, notify_organizing")
        .eq("id", event.user_id)
        .single();

      if (hostProfile?.notify_organizing !== false) {
        const hostName = hostProfile?.first_name || hostProfile?.display_name || "Host";
        const hostLanguage = hostProfile?.language === "en" ? "en" : "de";

        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            type: "event_reminder_host",
            recipientUserId: event.user_id,
            recipientName: hostName,
            language: hostLanguage,
            eventName: event.name,
            eventDate: event.event_date,
            eventTime: event.event_time,
            eventLocation: event.location,
            eventUrl,
            participantCount,
          }),
        });

        if (response.ok) {
          totalNotificationsSent++;
          console.log(`[SEND-EVENT-REMINDERS] Sent host reminder for ${event.name}`);
        } else {
          console.error(`[SEND-EVENT-REMINDERS] Failed to send host reminder for ${event.name}`);
        }
      }

      // Mark event as reminded
      const { error: updateError } = await supabase
        .from("events")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", event.id);

      if (updateError) {
        console.error(`[SEND-EVENT-REMINDERS] Error updating reminder_sent_at for ${event.id}:`, updateError);
      } else {
        console.log(`[SEND-EVENT-REMINDERS] Marked event ${event.id} as reminded`);
      }
    }

    console.log(`[SEND-EVENT-REMINDERS] Job complete. Sent ${totalNotificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        eventsProcessed: events.length,
        notificationsSent: totalNotificationsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("[SEND-EVENT-REMINDERS] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
