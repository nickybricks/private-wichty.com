-- Add allow_multiple_tickets field to events table
-- Default is true (multiple tickets per purchase allowed by default)
ALTER TABLE public.events 
ADD COLUMN allow_multiple_tickets BOOLEAN DEFAULT true;