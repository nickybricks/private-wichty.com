-- Schedule hourly cron job to check for ended events and send summary notifications
SELECT cron.schedule(
  'send-event-ended-hourly',
  '30 * * * *', -- Every hour at :30 minutes (offset from reminders)
  $$
  SELECT
    net.http_post(
        url:='https://yskajilatxzwtnunxxvs.supabase.co/functions/v1/send-event-ended',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlza2FqaWxhdHh6d3RudW54eHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MjQxMDIsImV4cCI6MjA4MDQwMDEwMn0.YwD7PaBOhY9TdbN3J6R4K6vsk3VF4i1soZMKuUhw8Q8"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);