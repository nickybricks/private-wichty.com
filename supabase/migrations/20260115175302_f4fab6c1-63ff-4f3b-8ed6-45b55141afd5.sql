-- Allow public uploads to the demo/ folder in event-images bucket
CREATE POLICY "Allow public uploads to demo folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = 'demo');

-- Allow public updates to demo folder (for upsert)
CREATE POLICY "Allow public updates to demo folder"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = 'demo')
WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = 'demo');