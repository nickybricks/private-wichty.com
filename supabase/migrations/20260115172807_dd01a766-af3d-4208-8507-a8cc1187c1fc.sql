-- Update Demo Events mit den generierten Bildern (Public URLs von den generierten Assets)
-- Die Bilder werden direkt über die Supabase Storage URLs referenziert

-- Hockey Winterturnier Hamburg
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/hockey-tournament.jpg'
WHERE id = 'a1b2c3d4-0001-4000-8000-000000000001';

-- Tennis Mixed-Doppel Berlin
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/tennis-mixed.jpg'
WHERE id = 'a1b2c3d4-0002-4000-8000-000000000002';

-- Golf Schnupperkurs Hamburg
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/golf-beginner.jpg'
WHERE id = 'a1b2c3d4-0003-4000-8000-000000000003';

-- Hockey Bundesliga Berlin
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/hockey-bundesliga.jpg'
WHERE id = 'a1b2c3d4-0004-4000-8000-000000000004';

-- Tennis Frühjahrsturnier Hamburg
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/tennis-tournament.jpg'
WHERE id = 'a1b2c3d4-0005-4000-8000-000000000005';

-- Golf Charity Cup Berlin
UPDATE events 
SET image_url = 'https://yskajilatxzwtnunxxvs.supabase.co/storage/v1/object/public/event-images/demo/golf-charity.jpg'
WHERE id = 'a1b2c3d4-0006-4000-8000-000000000006';