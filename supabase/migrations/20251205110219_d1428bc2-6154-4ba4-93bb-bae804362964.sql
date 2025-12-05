-- Create tickets table for QR code-based tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  ticket_category_id UUID REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  ticket_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view tickets by code"
ON public.tickets
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create tickets"
ON public.tickets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Event owners can update tickets"
ON public.tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tickets.event_id
    AND events.user_id = auth.uid()
  )
);

CREATE POLICY "Ticket owners can view their tickets"
ON public.tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.participants
    WHERE participants.id = tickets.participant_id
    AND participants.user_id = auth.uid()
  )
);

-- Create index for fast lookups
CREATE INDEX idx_tickets_ticket_code ON public.tickets(ticket_code);
CREATE INDEX idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX idx_tickets_participant_id ON public.tickets(participant_id);