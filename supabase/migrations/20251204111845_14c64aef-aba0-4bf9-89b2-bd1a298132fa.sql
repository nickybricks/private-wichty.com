-- Fix function search path warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Add has_spun column to participants
ALTER TABLE public.participants ADD COLUMN has_spun BOOLEAN NOT NULL DEFAULT false;