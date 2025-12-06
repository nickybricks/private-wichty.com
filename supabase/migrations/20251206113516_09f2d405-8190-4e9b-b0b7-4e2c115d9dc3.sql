-- Add column to track when reminder was sent
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient querying of upcoming events
CREATE INDEX IF NOT EXISTS idx_events_reminder_query 
ON public.events (event_date, event_time, reminder_sent_at) 
WHERE status = 'waiting' OR status = 'active';