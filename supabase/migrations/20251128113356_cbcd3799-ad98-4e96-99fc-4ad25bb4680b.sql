-- Add user_id columns to events and participants
ALTER TABLE public.events
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.participants
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_participants_user_id ON public.participants(user_id);

-- Update RLS policies for events table
DROP POLICY IF EXISTS "Anyone can create events" ON public.events;
DROP POLICY IF EXISTS "Anyone can update events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- Authenticated users can create their own events
CREATE POLICY "Users can create their own events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view events (to join via link)
CREATE POLICY "Anyone can view events"
  ON public.events
  FOR SELECT
  TO public
  USING (true);

-- Users can update their own events
CREATE POLICY "Users can update their own events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for participants table
DROP POLICY IF EXISTS "Anyone can create participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can update participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON public.participants;

-- Authenticated users can join events
CREATE POLICY "Authenticated users can join events"
  ON public.participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view participants of an event
CREATE POLICY "Anyone can view participants"
  ON public.participants
  FOR SELECT
  TO public
  USING (true);

-- Users can update their own participant records
CREATE POLICY "Users can update their own participant records"
  ON public.participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);