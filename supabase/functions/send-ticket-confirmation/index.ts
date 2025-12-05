import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  event_location?: string;
  language?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      participant_id,
      event_id,
      ticket_code,
      participant_name,
      participant_email,
      event_name,
      event_date,
      event_time,
      event_location,
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 24px 24px; text-align: center;">
                    <div style="display: inline-block; background-color: #f0f0f0; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1px; color: #666;">
                      TICKET
                    </div>
                  </td>
                </tr>
                
                <!-- Event Name -->
                <tr>
                  <td style="padding: 0 24px 16px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                      ${event_name}
                    </h1>
                  </td>
                </tr>
                
                <!-- Event Details -->
                <tr>
                  <td style="padding: 0 24px 24px; text-align: center;">
                    ${dateText ? `
                      <p style="margin: 0 0 8px; font-size: 14px; color: #666;">
                        📅 ${dateText}${event_time ? ` • ${event_time} ${isGerman ? 'Uhr' : ''}` : ''}
                      </p>
                    ` : ''}
                    ${event_location ? `
                      <p style="margin: 0; font-size: 14px; color: #666;">
                        📍 ${event_location}
                      </p>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                  <td style="padding: 0 24px 24px; text-align: center;">
                    <p style="margin: 0; font-size: 16px; color: #333;">
                      ${isGerman 
                        ? `Hey ${participant_name}, du bist dabei! 🎉` 
                        : `Hey ${participant_name}, you're in! 🎉`}
                    </p>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td style="padding: 0 24px 32px; text-align: center;">
                    <a href="${ticketUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      ${isGerman ? 'Ticket ansehen' : 'View Ticket'}
                    </a>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 24px;">
                    <hr style="border: none; border-top: 1px solid #eee; margin: 0;">
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 12px; color: #999;">
                      ${isGerman 
                        ? 'Zeige dieses Ticket am Eingang vor.' 
                        : 'Show this ticket at the entrance.'}
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #999;">
                      ${isGerman ? 'Gesendet mit' : 'Sent with'} ❤️ ${isGerman ? 'von' : 'by'} wichty.de
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "wichty <tickets@wichty.com>",
        to: [participant_email],
        subject,
        html,
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
  } catch (error: any) {
    console.error("Error in send-ticket-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);