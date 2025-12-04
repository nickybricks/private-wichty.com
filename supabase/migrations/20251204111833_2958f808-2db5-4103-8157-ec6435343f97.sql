-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create event status enum
CREATE TYPE public.event_status AS ENUM ('waiting', 'active', 'completed');

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_participants INTEGER NOT NULL DEFAULT 2,
  status public.event_status NOT NULL DEFAULT 'waiting',
  image_url TEXT,
  event_date DATE,
  event_time TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Create participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  wish TEXT,
  assigned_to UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Anyone can view participants of an event" ON public.participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join events" ON public.participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own participant entry" ON public.participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Event owners can delete participants" ON public.participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = participants.event_id 
      AND events.user_id = auth.uid()
    )
  );

-- Create function to perform the draw
CREATE OR REPLACE FUNCTION public.perform_draw(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant_ids UUID[];
  v_shuffled_ids UUID[];
  v_count INTEGER;
  v_event_owner UUID;
BEGIN
  -- Check if user is the event owner
  SELECT user_id INTO v_event_owner FROM events WHERE id = p_event_id;
  IF v_event_owner != auth.uid() THEN
    RAISE EXCEPTION 'Only the event owner can perform the draw';
  END IF;

  -- Get all participant IDs for this event
  SELECT ARRAY_AGG(id ORDER BY random()) INTO v_participant_ids
  FROM participants WHERE event_id = p_event_id;

  v_count := array_length(v_participant_ids, 1);
  
  IF v_count < 2 THEN
    RAISE EXCEPTION 'Need at least 2 participants for the draw';
  END IF;

  -- Create a circular assignment (each person gifts to the next)
  FOR i IN 1..v_count LOOP
    UPDATE participants 
    SET assigned_to = v_participant_ids[(i % v_count) + 1]
    WHERE id = v_participant_ids[i];
  END LOOP;

  -- Update event status to active
  UPDATE events SET status = 'active', updated_at = now()
  WHERE id = p_event_id;

  RETURN TRUE;
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();