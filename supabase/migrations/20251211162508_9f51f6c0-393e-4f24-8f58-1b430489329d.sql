-- Add end_date column to events table for multi-day events
ALTER TABLE public.events 
ADD COLUMN end_date date NULL;