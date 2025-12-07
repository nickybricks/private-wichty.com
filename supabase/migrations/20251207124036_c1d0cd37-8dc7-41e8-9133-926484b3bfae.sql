-- Add new columns to events table for Explore feature
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_count integer DEFAULT 0;

-- Create index for city-based queries
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_is_public ON public.events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN(tags);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE events SET view_count = view_count + 1 WHERE id = event_id;
END;
$$;

-- Create function to increment attendance count
CREATE OR REPLACE FUNCTION public.increment_attendance_count(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE events SET attendance_count = attendance_count + 1 WHERE id = event_id;
END;
$$;