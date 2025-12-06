-- Schedule cron job to run every hour for event reminders
SELECT cron.schedule(
  'send-event-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://yskajilatxzwtnunxxvs.supabase.co/functions/v1/send-event-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlza2FqaWxhdHh6d3RudW54eHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjQxMDIsImV4cCI6MjA4MDQwMDEwMn0.YwD7PaBOhY9TdbN3J6R4K6vsk3VF4i1soZMKuUhw8Q8"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);