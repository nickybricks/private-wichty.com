-- Add notification settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_participating boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_organizing boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_product_updates boolean DEFAULT false;