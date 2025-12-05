import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EMAIL_BRANDING, generateEmailHtml } from "../_shared/email-template.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = 'password_reset' | 'email_confirmation' | 'magic_link';

interface AuthEmailRequest {
  email: string;
  type: EmailType;
  token_hash?: string;
  redirect_to?: string;
  language?: 'de' | 'en';
  display_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      type,
      token_hash,
      redirect_to,
      language = 'de',
      display_name,
    }: AuthEmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, email);

    const isGerman = language === 'de';
    const name = display_name || email.split('@')[0];
    const baseUrl = redirect_to || 'https://wichty.com';
    
    let subject: string;
    let badge: string;
    let title: string;
    let message: string;
    let buttonText: string;
    let buttonUrl: string;
    let footerText: string;

    switch (type) {
      case 'password_reset':
        subject = isGerman ? 'Passwort zurücksetzen' : 'Reset your password';
        badge = isGerman ? 'PASSWORT' : 'PASSWORD';
        title = isGerman ? 'Passwort zurücksetzen' : 'Reset your password';
        message = isGerman 
          ? `Hey ${name}, klicke auf den Button unten, um dein Passwort zu ändern.`
          : `Hey ${name}, click the button below to change your password.`;
        buttonText = isGerman ? 'Passwort zurücksetzen' : 'Reset Password';
        buttonUrl = token_hash 
          ? `${baseUrl}/reset-password?token_hash=${token_hash}&type=recovery`
          : baseUrl;
        footerText = isGerman 
          ? 'Falls du das nicht angefordert hast, ignoriere diese E-Mail.'
          : "If you didn't request this, you can ignore this email.";
        break;

      case 'email_confirmation':
        subject = isGerman ? 'Bestätige deine E-Mail' : 'Confirm your email';
        badge = isGerman ? 'WILLKOMMEN' : 'WELCOME';
        title = isGerman ? 'Willkommen bei wichty! ✨' : 'Welcome to wichty! ✨';
        message = isGerman 
          ? `Hey ${name}, schön dass du dabei bist! Bestätige deine E-Mail-Adresse, um loszulegen.`
          : `Hey ${name}, great to have you! Confirm your email address to get started.`;
        buttonText = isGerman ? 'E-Mail bestätigen' : 'Confirm Email';
        buttonUrl = token_hash 
          ? `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=signup`
          : baseUrl;
        footerText = isGerman 
          ? 'Falls du dich nicht registriert hast, ignoriere diese E-Mail.'
          : "If you didn't sign up, you can ignore this email.";
        break;

      case 'magic_link':
        subject = isGerman ? 'Dein Login-Link' : 'Your login link';
        badge = 'LOGIN';
        title = isGerman ? 'Einloggen bei wichty' : 'Log in to wichty';
        message = isGerman 
          ? `Hey ${name}, klicke auf den Button unten, um dich einzuloggen.`
          : `Hey ${name}, click the button below to log in.`;
        buttonText = isGerman ? 'Einloggen' : 'Log In';
        buttonUrl = token_hash 
          ? `${baseUrl}/auth/confirm?token_hash=${token_hash}&type=magiclink`
          : baseUrl;
        footerText = isGerman 
          ? 'Dieser Link ist nur einmal verwendbar und läuft nach 1 Stunde ab.'
          : 'This link can only be used once and expires after 1 hour.';
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
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
        to: [email],
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

    return new Response(JSON.stringify({ success: true, emailData }), {
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
