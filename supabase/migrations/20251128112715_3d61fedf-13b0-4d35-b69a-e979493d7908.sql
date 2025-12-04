-- Create status enum for events
CREATE TYPE event_status AS ENUM ('waiting', 'active', 'completed');

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_participants INTEGER NOT NULL CHECK (target_participants > 0),
  status event_status NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  wish TEXT NOT NULL CHECK (length(trim(wish)) > 0),
  has_spun BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES public.participants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_participants_event_id ON public.participants(event_id);
CREATE INDEX idx_participants_assigned_to ON public.participants(assigned_to);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table (public read access)
CREATE POLICY "Anyone can view events"
  ON public.events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create events"
  ON public.events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON public.events
  FOR UPDATE
  TO public
  USING (true);

-- RLS Policies for participants table (public access with constraints)
CREATE POLICY "Anyone can view participants"
  ON public.participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create participants"
  ON public.participants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON public.participants
  FOR UPDATE
  TO public
  USING (true);

-- Function to automatically activate event when target is reached
CREATE OR REPLACE FUNCTION check_event_ready()
RETURNS TRIGGER AS $$
DECLARE
  participant_count INTEGER;
  target INTEGER;
BEGIN
  -- Get current participant count and target
  SELECT COUNT(*), e.target_participants
  INTO participant_count, target
  FROM public.participants p
  JOIN public.events e ON e.id = p.event_id
  WHERE p.event_id = NEW.event_id
  GROUP BY e.target_participants;
  
  -- Update event status if target reached
  IF participant_count >= target THEN
    UPDATE public.events
    SET status = 'active'
    WHERE id = NEW.event_id AND status = 'waiting';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check event readiness after each participant joins
CREATE TRIGGER check_event_ready_trigger
AFTER INSERT ON public.participants
FOR EACH ROW
EXECUTE FUNCTION check_event_ready();

-- Function to perform the draw (fair assignment)
CREATE OR REPLACE FUNCTION perform_draw(p_participant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_available_participants UUID[];
  v_assigned_to UUID;
BEGIN
  -- Get the event_id for this participant
  SELECT event_id INTO v_event_id
  FROM public.participants
  WHERE id = p_participant_id;
  
  -- Get list of available participants (not self, not already assigned to someone, not already drawn by this participant)
  SELECT ARRAY_AGG(p.id)
  INTO v_available_participants
  FROM public.participants p
  WHERE p.event_id = v_event_id
    AND p.id != p_participant_id
    AND NOT EXISTS (
      SELECT 1 FROM public.participants p2
      WHERE p2.assigned_to = p.id
    );
  
  -- If no available participants, return null
  IF v_available_participants IS NULL OR array_length(v_available_participants, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  -- Randomly select one participant
  v_assigned_to := v_available_participants[1 + floor(random() * array_length(v_available_participants, 1))::int];
  
  -- Update the participant with the assignment
  UPDATE public.participants
  SET assigned_to = v_assigned_to, has_spun = true
  WHERE id = p_participant_id;
  
  RETURN v_assigned_to;
END;
$$ LANGUAGE plpgsql;