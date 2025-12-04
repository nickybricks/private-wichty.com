-- Add event_date and location columns to events table
ALTER TABLE public.events 
ADD COLUMN event_date DATE,
ADD COLUMN location TEXT;