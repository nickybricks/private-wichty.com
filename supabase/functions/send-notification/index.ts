import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  EMAIL_BRANDING,
  generateNotificationEmailHtml,
  getNotificationContent,
  type NotificationType,
  type NotificationEmailContent,
} from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  language?: "de" | "en";
  // Event-related fields
  eventName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  eventUrl?: string;
  ticketUrl?: string;
  // Participant-related fields (for host notifications)
  participantName?: string;
  participantCount?: number;
  ticketCount?: number;
  revenue?: string;
  // Custom message
  customMessage?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: NotificationRequest = await req.json();
    
    console.log("Received notification request:", {
      type: request.type,
      recipientEmail: request.recipientEmail,
      eventName: request.eventName,
    });

    // Validate required fields
    if (!request.type || !request.recipientEmail || !request.recipientName) {
      console.error("Missing required fields:", request);
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipientEmail, recipientName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const language = request.language || "de";

    // Build notification content
    const notificationContent: NotificationEmailContent = {
      type: request.type,
      language,
      recipientEmail: request.recipientEmail,
      recipientName: request.recipientName,
      eventName: request.eventName,
      eventDate: request.eventDate,
      eventTime: request.eventTime,
      eventLocation: request.eventLocation,
      eventUrl: request.eventUrl,
      ticketUrl: request.ticketUrl,
      participantName: request.participantName,
      participantCount: request.participantCount,
      ticketCount: request.ticketCount,
      revenue: request.revenue,
      customMessage: request.customMessage,
    };

    // Get content for subject line
    const emailContent = getNotificationContent(notificationContent);

    // Generate HTML
    const html = generateNotificationEmailHtml(notificationContent);

    // Determine sender based on notification type
    let sender = EMAIL_BRANDING.sender.noreply;
    if (
      request.type.includes("ticket") ||
      request.type === "ticket_purchased" ||
      request.type === "ticket_rsvp" ||
      request.type === "join_request_approved"
    ) {
      sender = EMAIL_BRANDING.sender.tickets;
    } else if (
      request.type.includes("event") ||
      request.type.includes("rsvp") ||
      request.type.includes("purchase") ||
      request.type.includes("join_request") ||
      request.type.includes("participant")
    ) {
      sender = EMAIL_BRANDING.sender.events;
    }

    console.log("Sending email:", {
      from: sender,
      to: request.recipientEmail,
      subject: emailContent.subject,
    });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: sender,
      to: [request.recipientEmail],
      subject: emailContent.subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
