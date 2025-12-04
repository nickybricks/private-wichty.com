-- Add theme and language preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS language text DEFAULT 'de';