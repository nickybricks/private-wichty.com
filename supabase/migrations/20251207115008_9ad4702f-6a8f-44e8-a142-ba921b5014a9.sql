-- Add granular notification settings for guests
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_guest_ticket_confirmation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_guest_join_request_status boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_guest_cancellation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_guest_event_reminder boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_guest_checkin boolean DEFAULT true;

-- Add granular notification settings for hosts
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notify_host_new_registration boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_host_join_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_host_cancellation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_host_event_created boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_host_event_reminder boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_host_event_summary boolean DEFAULT true;

-- Migrate existing settings to new granular fields
UPDATE public.profiles 
SET 
  notify_guest_ticket_confirmation = COALESCE(notify_participating, true),
  notify_guest_join_request_status = COALESCE(notify_participating, true),
  notify_guest_cancellation = COALESCE(notify_participating, true),
  notify_guest_event_reminder = COALESCE(notify_participating, true),
  notify_guest_checkin = COALESCE(notify_participating, true),
  notify_host_new_registration = COALESCE(notify_organizing, true),
  notify_host_join_requests = COALESCE(notify_organizing, true),
  notify_host_cancellation = COALESCE(notify_organizing, true),
  notify_host_event_created = COALESCE(notify_organizing, true),
  notify_host_event_reminder = COALESCE(notify_organizing, true),
  notify_host_event_summary = COALESCE(notify_organizing, true)
WHERE notify_participating IS NOT NULL OR notify_organizing IS NOT NULL;