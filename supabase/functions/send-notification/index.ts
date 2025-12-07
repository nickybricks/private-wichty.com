import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
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
  recipientEmail?: string;
  recipientUserId?: string; // Alternative: fetch email from user ID
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

// Map notification types to profile settings
const getNotificationSettingField = (type: NotificationType): string | null => {
  const mapping: Record<string, string> = {
    // Guest notifications
    'ticket_purchased': 'notify_guest_ticket_confirmation',
    'ticket_rsvp': 'notify_guest_ticket_confirmation',
    'join_request_approved': 'notify_guest_join_request_status',
    'join_request_rejected': 'notify_guest_join_request_status',
    'event_cancelled': 'notify_guest_cancellation',
    'event_reminder_guest': 'notify_guest_event_reminder',
    'ticket_checked_in': 'notify_guest_checkin',
    
    // Host notifications
    'new_rsvp': 'notify_host_new_registration',
    'new_purchase': 'notify_host_new_registration',
    'new_join_request': 'notify_host_join_requests',
    'participant_cancelled': 'notify_host_cancellation',
    'event_created': 'notify_host_event_created',
    'event_reminder_host': 'notify_host_event_reminder',
    'event_ended': 'notify_host_event_summary',
  };
  
  return mapping[type] || null;
};

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
      recipientUserId: request.recipientUserId,
      eventName: request.eventName,
    });

    // Validate required fields
    if (!request.type || !request.recipientName) {
      console.error("Missing required fields:", request);
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, recipientName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get recipient email - either directly provided or fetched from user ID
    let recipientEmail = request.recipientEmail;
    let userId = request.recipientUserId;
    
    if (!recipientEmail && userId) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !userData.user?.email) {
        console.error("Failed to fetch user email:", userError);
        return new Response(
          JSON.stringify({ error: "Could not fetch recipient email" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      recipientEmail = userData.user.email;
      console.log("Fetched email for user:", userId, "->", recipientEmail);
    }

    if (!recipientEmail) {
      console.error("No recipient email provided or found");
      return new Response(
        JSON.stringify({ error: "Missing recipientEmail or recipientUserId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check user's notification preferences
    const settingField = getNotificationSettingField(request.type);
    
    if (settingField && userId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select(settingField)
        .eq("id", userId)
        .single();
      
      // Check if the specific notification type is disabled
      const profileData = profile as Record<string, unknown> | null;
      if (profileData && profileData[settingField] === false) {
        console.log(`Notification ${request.type} disabled for user ${userId} (${settingField}=false)`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            skipped: true, 
            reason: `User has disabled ${settingField}` 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    const language = request.language || "de";

    // Build notification content
    const notificationContent: NotificationEmailContent = {
      type: request.type,
      language,
      recipientEmail,
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
      to: recipientEmail,
      subject: emailContent.subject,
    });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: sender,
      to: [recipientEmail],
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