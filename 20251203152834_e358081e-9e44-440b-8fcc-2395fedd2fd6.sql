-- Add event_time column to events table (optional)
ALTER TABLE public.events 
ADD COLUMN event_time TIME;