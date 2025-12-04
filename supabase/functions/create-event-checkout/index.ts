import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform fee percentage (5%)
const PLATFORM_FEE_PERCENT = 5;

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-EVENT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { event_id, participant_name, participant_wish } = await req.json();
    if (!event_id) throw new Error("event_id is required");
    if (!participant_name) throw new Error("participant_name is required");
    logStep("Request data", { event_id, participant_name });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*, user_id")
      .eq("id", event_id)
      .maybeSingle();

    if (eventError || !event) throw new Error("Event not found");
    logStep("Event found", { eventId: event.id, price: event.price_cents, ownerId: event.user_id });

    if (!event.is_paid || !event.price_cents || event.price_cents <= 0) {
      throw new Error("Event is not a paid event");
    }

    // Get event owner's Stripe account
    const { data: ownerProfile } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", event.user_id)
      .maybeSingle();

    if (!ownerProfile?.stripe_account_id || !ownerProfile.stripe_onboarding_complete) {
      throw new Error("Event owner has not connected Stripe");
    }
    logStep("Owner Stripe account", { accountId: ownerProfile.stripe_account_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Calculate application fee (platform fee)
    const applicationFee = Math.round(event.price_cents * (PLATFORM_FEE_PERCENT / 100));
    logStep("Fee calculation", { 
      price: event.price_cents, 
      applicationFee, 
      feePercent: PLATFORM_FEE_PERCENT 
    });

    const origin = req.headers.get("origin") || "https://yskajilatxzwtnunxxvs.lovable.app";
    
    // Create checkout session with destination charge
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: event.currency || "eur",
            product_data: {
              name: `Teilnahme: ${event.name}`,
              description: `Wichtelspiel beitreten als ${participant_name}`,
            },
            unit_amount: event.price_cents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: ownerProfile.stripe_account_id,
        },
      },
      metadata: {
        event_id: event_id,
        participant_name: participant_name,
        participant_wish: participant_wish || "",
        user_id: userId || "",
      },
      success_url: `${origin}/event/${event_id}?payment_success=true&name=${encodeURIComponent(participant_name)}&wish=${encodeURIComponent(participant_wish || "")}`,
      cancel_url: `${origin}/event/${event_id}?payment_cancelled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
