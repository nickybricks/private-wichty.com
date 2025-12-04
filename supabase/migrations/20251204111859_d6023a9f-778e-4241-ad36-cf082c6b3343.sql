-- Create function for individual participant spin
CREATE OR REPLACE FUNCTION public.spin_wheel(p_participant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_assigned_id UUID;
BEGIN
  -- Get event_id and assigned_to for this participant
  SELECT event_id, assigned_to INTO v_event_id, v_assigned_id
  FROM participants WHERE id = p_participant_id;

  IF v_assigned_id IS NULL THEN
    RAISE EXCEPTION 'No assignment found for this participant';
  END IF;

  -- Mark as spun
  UPDATE participants SET has_spun = true WHERE id = p_participant_id;

  RETURN v_assigned_id;
END;
$$;