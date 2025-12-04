-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view participants" ON public.participants;

-- Create a more restrictive SELECT policy
-- Users can only view participants if:
-- 1. They are the event owner, OR
-- 2. They are a participant in the same event
CREATE POLICY "Users can view participants in their events"
ON public.participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = participants.event_id 
    AND events.user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.participants p2 
    WHERE p2.event_id = participants.event_id 
    AND p2.user_id = auth.uid()
  )
);