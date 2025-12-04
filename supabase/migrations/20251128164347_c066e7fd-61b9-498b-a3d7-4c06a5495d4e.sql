-- Add name column to events table
ALTER TABLE public.events 
ADD COLUMN name TEXT NOT NULL DEFAULT 'Mein Event';