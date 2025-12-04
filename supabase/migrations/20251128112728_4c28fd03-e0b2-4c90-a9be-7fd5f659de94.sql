-- Fix search_path for check_event_ready function
CREATE OR REPLACE FUNCTION check_event_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix search_path for perform_draw function
CREATE OR REPLACE FUNCTION perform_draw(p_participant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;