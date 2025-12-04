-- Add Stripe Connect fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN stripe_account_id text,
ADD COLUMN stripe_onboarding_complete boolean DEFAULT false;

-- Add price fields to events
ALTER TABLE public.events 
ADD COLUMN price_cents integer DEFAULT 0,
ADD COLUMN currency text DEFAULT 'eur';