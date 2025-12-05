-- Add waitlist_enabled column to events table
ALTER TABLE public.events 
ADD COLUMN waitlist_enabled boolean DEFAULT false;