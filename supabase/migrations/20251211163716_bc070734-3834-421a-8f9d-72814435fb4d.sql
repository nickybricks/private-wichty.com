-- Create cities table
CREATE TABLE public.cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Deutschland',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view cities
CREATE POLICY "Anyone can view cities"
  ON public.cities
  FOR SELECT
  USING (true);

-- Only admins can modify cities (for now, no one can modify via API)
-- Cities will be managed via migrations/direct DB access

-- Create storage bucket for city images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('city-images', 'city-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to city images
CREATE POLICY "City images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'city-images');

-- Insert initial cities data
INSERT INTO public.cities (id, name, country, image_url) VALUES
  ('berlin', 'Berlin', 'Deutschland', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&h=400&fit=crop'),
  ('muenchen', 'München', 'Deutschland', 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=400&fit=crop'),
  ('hamburg', 'Hamburg', 'Deutschland', 'https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400&h=400&fit=crop'),
  ('koeln', 'Köln', 'Deutschland', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop'),
  ('frankfurt', 'Frankfurt', 'Deutschland', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=400&fit=crop'),
  ('duesseldorf', 'Düsseldorf', 'Deutschland', 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=400&h=400&fit=crop'),
  ('stuttgart', 'Stuttgart', 'Deutschland', 'https://images.unsplash.com/photo-1551522355-5c4f29207fc0?w=400&h=400&fit=crop'),
  ('leipzig', 'Leipzig', 'Deutschland', 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=400&fit=crop')
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;