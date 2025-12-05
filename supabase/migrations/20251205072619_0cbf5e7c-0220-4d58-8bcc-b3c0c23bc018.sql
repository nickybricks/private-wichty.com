-- Create ticket_categories table
CREATE TABLE public.ticket_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  max_quantity INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view ticket categories
CREATE POLICY "Anyone can view ticket categories"
ON public.ticket_categories
FOR SELECT
USING (true);

-- Event owners can create ticket categories
CREATE POLICY "Event owners can create ticket categories"
ON public.ticket_categories
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_categories.event_id
    AND events.user_id = auth.uid()
  )
);

-- Event owners can update ticket categories
CREATE POLICY "Event owners can update ticket categories"
ON public.ticket_categories
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_categories.event_id
    AND events.user_id = auth.uid()
  )
);

-- Event owners can delete ticket categories
CREATE POLICY "Event owners can delete ticket categories"
ON public.ticket_categories
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = ticket_categories.event_id
    AND events.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_categories_updated_at
BEFORE UPDATE ON public.ticket_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();