-- Add pass_fee_to_customer column to ticket_categories table
ALTER TABLE public.ticket_categories
ADD COLUMN pass_fee_to_customer boolean NOT NULL DEFAULT false;