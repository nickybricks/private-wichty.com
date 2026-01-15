import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EMAIL_BRANDING, generateTicketEmailHtml, generateICSContent } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketEmailRequest {
  participant_id: string;
  event_id: string;
  ticket_code: string;
  participant_name: string;
  participant_email: string;
  event_name: string;
  event_date?: string;
  event_time?: string;
  end_date?: string;
  end_time?: string;
  event_location?: string;
  event_description?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      ticket_code,
      participant_name,
      participant_email,
      event_name,
      event_date,
      event_time,
      end_date,
      end_time,
      event_location,
      event_description,
      language = 'de',
    }: TicketEmailRequest = await req.json();

    console.log("Sending ticket confirmation to:", participant_email);

    const ticketUrl = `${req.headers.get("origin") || "https://wichty.com"}/ticket/${ticket_code}`;
    const isGerman = language === 'de';

    const subject = isGerman 
      ? `Dein Ticket für ${event_name}` 
      : `Your ticket for ${event_name}`;

    const dateText = event_date 
      ? new Date(event_date).toLocaleDateString(isGerman ? 'de-DE' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : null;

    const html = generateTicketEmailHtml({
      eventName: event_name,
      participantName: participant_name,
      dateText,
      timeText: event_time,
      location: event_location,
      ticketUrl,
      language: isGerman ? 'de' : 'en',
    });

    // Generate ICS calendar attachment if event date is available
    let attachments: Array<{ filename: string; content: string }> | undefined;
    
    if (event_date) {
      const icsContent = generateICSContent({
        eventName: event_name,
        eventDate: event_date,
        eventTime: event_time,
        endDate: end_date,
        endTime: end_time,
        location: event_location,
        description: event_description,
        ticketUrl,
      });

      // Base64 encode the ICS content for Resend attachment
      const encoder = new TextEncoder();
      const icsBytes = encoder.encode(icsContent);
      const base64ICS = btoa(String.fromCharCode(...icsBytes));

      attachments = [
        {
          filename: `${event_name.replace(/[^a-zA-Z0-9]/g, '-')}.ics`,
          content: base64ICS,
        },
      ];

      console.log("Generated ICS calendar attachment for event:", event_name);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_BRANDING.sender.tickets,
        to: [participant_email],
        subject,
        html,
        ...(attachments && { attachments }),
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-ticket-confirmation function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
