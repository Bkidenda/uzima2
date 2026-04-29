
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Username generator (collision-safe)
CREATE OR REPLACE FUNCTION public.generate_unique_username(base TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned TEXT;
  candidate TEXT;
  attempts INT := 0;
BEGIN
  cleaned := lower(regexp_replace(coalesce(base, ''), '[^a-zA-Z0-9_]', '', 'g'));
  IF cleaned IS NULL OR length(cleaned) < 3 THEN
    cleaned := 'uzima' || substr(md5(random()::text), 1, 6);
  END IF;
  cleaned := substr(cleaned, 1, 20);
  candidate := cleaned;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    attempts := attempts + 1;
    candidate := cleaned || floor(random() * 9000 + 1000)::text;
    IF attempts > 10 THEN
      candidate := cleaned || substr(md5(random()::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username TEXT;
  final_username TEXT;
  display TEXT;
BEGIN
  desired_username := NEW.raw_user_meta_data ->> 'username';
  IF desired_username IS NULL OR length(trim(desired_username)) = 0 THEN
    desired_username := split_part(NEW.email, '@', 1);
  END IF;
  final_username := public.generate_unique_username(desired_username);
  display := coalesce(NEW.raw_user_meta_data ->> 'display_name', final_username);
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, display);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
