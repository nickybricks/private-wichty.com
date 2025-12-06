-- Create join_requests table for events that require approval
CREATE TABLE public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view join requests (needed for checking own status)
CREATE POLICY "Users can view their own join requests"
ON public.join_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Event owners can view all requests for their events
CREATE POLICY "Event owners can view join requests"
ON public.join_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = join_requests.event_id
  AND events.user_id = auth.uid()
));

-- Authenticated users can create join requests
CREATE POLICY "Authenticated users can create join requests"
ON public.join_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Event owners can update join requests (approve/reject)
CREATE POLICY "Event owners can update join requests"
ON public.join_requests
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.events
  WHERE events.id = join_requests.event_id
  AND events.user_id = auth.uid()
));

-- Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON public.join_requests
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_join_requests_updated_at
BEFORE UPDATE ON public.join_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient queries
CREATE INDEX idx_join_requests_event_status ON public.join_requests(event_id, status);