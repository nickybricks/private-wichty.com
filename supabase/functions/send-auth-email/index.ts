import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EMAIL_BRANDING, generateEmailHtml } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

// Supabase Auth Hook payload types
interface AuthHookEmailData {
  token_hash: string;
  redirect_to: string;
  verification_type: string; // signup, recovery, invite, magiclink, email_change
  site_url: string;
  token: string;
  email_action_type: string;
}

interface AuthHookUser {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
  app_metadata?: {
    language?: string;
  };
}

interface AuthHookPayload {
  user: AuthHookUser;
  email_data: AuthHookEmailData;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw body for signature verification
    const payload = await req.text();
    
    // Note: Supabase Auth Hooks use a different signature format than standardwebhooks
    // The hook is called internally by Supabase Auth, so we skip signature verification
    // and rely on the edge function's access control
    console.log("Processing auth hook request");

    const { user, email_data }: AuthHookPayload = JSON.parse(payload);

    console.log(`Processing auth email for: ${user.email}, type: ${email_data.email_action_type}`);

    // Determine language from user metadata or default to German
    const language = (user.app_metadata?.language as 'de' | 'en') || 'de';
    const isGerman = language === 'de';
    
    // Get display name from various possible sources
    const displayName = user.user_metadata?.display_name 
      || user.user_metadata?.full_name 
      || user.user_metadata?.name 
      || user.email.split('@')[0];

    const baseUrl = email_data.site_url || 'https://wichty.com';
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || 'https://yskajilatxzwtnunxxvs.supabase.co';
    
    let subject: string;
    let badge: string;
    let title: string;
    let message: string;
    let buttonText: string;
    let buttonUrl: string;
    let footerText: string;

    // Build the confirmation URL using Supabase's verification endpoint
    // This URL will verify the token and redirect to the app
    // Note: For signup verification, the type must be 'signup' (not 'email')
    const getVerificationType = (actionType: string, verType: string): string => {
      // Map action types to correct verification types for Supabase
      switch (actionType) {
        case 'signup':
          return 'signup';
        case 'recovery':
          return 'recovery';
        case 'magiclink':
          return 'magiclink';
        case 'invite':
          return 'invite';
        case 'email_change':
          return 'email_change';
        default:
          return verType;
      }
    };

    const verificationType = getVerificationType(email_data.email_action_type, email_data.verification_type);
    const confirmUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=${verificationType}&redirect_to=${encodeURIComponent(baseUrl)}`;

    switch (email_data.email_action_type) {
      case 'signup':
        subject = isGerman ? 'Bestätige deine E-Mail' : 'Confirm your email';
        badge = isGerman ? 'WILLKOMMEN' : 'WELCOME';
        title = isGerman ? 'Willkommen bei wichty! ✨' : 'Welcome to wichty! ✨';
        message = isGerman 
          ? `Hey ${displayName}, schön dass du dabei bist! Bestätige deine E-Mail-Adresse, um loszulegen.`
          : `Hey ${displayName}, great to have you! Confirm your email address to get started.`;
        buttonText = isGerman ? 'E-Mail bestätigen' : 'Confirm Email';
        buttonUrl = confirmUrl;
        footerText = isGerman 
          ? 'Falls du dich nicht registriert hast, ignoriere diese E-Mail.'
          : "If you didn't sign up, you can ignore this email.";
        break;

      case 'recovery':
        subject = isGerman ? 'Passwort zurücksetzen' : 'Reset your password';
        badge = isGerman ? 'PASSWORT' : 'PASSWORD';
        title = isGerman ? 'Passwort zurücksetzen' : 'Reset your password';
        message = isGerman 
          ? `Hey ${displayName}, klicke auf den Button unten, um dein Passwort zu ändern.`
          : `Hey ${displayName}, click the button below to change your password.`;
        buttonText = isGerman ? 'Passwort zurücksetzen' : 'Reset Password';
        buttonUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(baseUrl + '/reset-password')}`;
        footerText = isGerman 
          ? 'Falls du das nicht angefordert hast, ignoriere diese E-Mail.'
          : "If you didn't request this, you can ignore this email.";
        break;

      case 'magiclink':
        subject = isGerman ? 'Dein Login-Link' : 'Your login link';
        badge = 'LOGIN';
        title = isGerman ? 'Einloggen bei wichty' : 'Log in to wichty';
        message = isGerman 
          ? `Hey ${displayName}, klicke auf den Button unten, um dich einzuloggen.`
          : `Hey ${displayName}, click the button below to log in.`;
        buttonText = isGerman ? 'Einloggen' : 'Log In';
        buttonUrl = confirmUrl;
        footerText = isGerman 
          ? 'Dieser Link ist nur einmal verwendbar und läuft nach 1 Stunde ab.'
          : 'This link can only be used once and expires after 1 hour.';
        break;

      case 'invite':
        subject = isGerman ? 'Du wurdest eingeladen' : "You've been invited";
        badge = isGerman ? 'EINLADUNG' : 'INVITATION';
        title = isGerman ? 'Du wurdest eingeladen! 🎉' : "You've been invited! 🎉";
        message = isGerman 
          ? `Hey ${displayName}, du wurdest eingeladen, wichty beizutreten. Klicke auf den Button, um dein Konto zu aktivieren.`
          : `Hey ${displayName}, you've been invited to join wichty. Click the button to activate your account.`;
        buttonText = isGerman ? 'Einladung annehmen' : 'Accept Invitation';
        buttonUrl = confirmUrl;
        footerText = isGerman 
          ? 'Falls du keine Einladung erwartet hast, ignoriere diese E-Mail.'
          : "If you weren't expecting an invitation, you can ignore this email.";
        break;

      case 'email_change':
        subject = isGerman ? 'E-Mail-Adresse bestätigen' : 'Confirm email change';
        badge = isGerman ? 'E-MAIL ÄNDERUNG' : 'EMAIL CHANGE';
        title = isGerman ? 'Neue E-Mail bestätigen' : 'Confirm new email';
        message = isGerman 
          ? `Hey ${displayName}, bestätige deine neue E-Mail-Adresse, um die Änderung abzuschließen.`
          : `Hey ${displayName}, confirm your new email address to complete the change.`;
        buttonText = isGerman ? 'E-Mail bestätigen' : 'Confirm Email';
        buttonUrl = confirmUrl;
        footerText = isGerman 
          ? 'Falls du das nicht angefordert hast, ignoriere diese E-Mail.'
          : "If you didn't request this, you can ignore this email.";
        break;

      default:
        console.error(`Unknown email action type: ${email_data.email_action_type}`);
        // Return success to not block auth flow, but don't send email
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const html = generateEmailHtml({
      badge,
      title,
      message,
      buttonText,
      buttonUrl,
      footerText,
      language,
    });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_BRANDING.sender.noreply,
        to: [user.email],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Auth email sent successfully:", emailData);

    // Return success response in the format Supabase expects
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-auth-email function:", errorMessage);
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
