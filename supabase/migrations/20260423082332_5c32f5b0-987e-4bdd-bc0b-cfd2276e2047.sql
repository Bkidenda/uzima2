-- =========================================================
-- 1. ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'cofounder', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE POLICY "Roles are viewable by everyone"
ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed cofounders by email when they sign up (and now if already present)
CREATE OR REPLACE FUNCTION public.assign_cofounder_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('bkidenda@gmail.com','lorraobare@gmail.com','maxinmwaura@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cofounder')
    ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_cofounder
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_cofounder_role();

-- Backfill: if any cofounder already exists in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'cofounder'::public.app_role FROM auth.users u
WHERE u.email IN ('bkidenda@gmail.com','lorraobare@gmail.com','maxinmwaura@gmail.com')
ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role FROM auth.users u
WHERE u.email IN ('bkidenda@gmail.com','lorraobare@gmail.com','maxinmwaura@gmail.com')
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2. PROFILES: full_name + favorite_verse
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS favorite_verse TEXT;

-- =========================================================
-- 3. COMMUNITIES: privacy
-- =========================================================
CREATE TYPE public.community_privacy AS ENUM ('public', 'private');

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS privacy public.community_privacy NOT NULL DEFAULT 'public';

-- Replace existing public-read policy with privacy-aware one
DROP POLICY IF EXISTS "Communities are viewable by everyone" ON public.communities;

CREATE POLICY "Public communities are viewable by everyone"
ON public.communities FOR SELECT TO public
USING (
  privacy = 'public'
  OR (auth.uid() IS NOT NULL AND public.is_community_member(id, auth.uid()))
  OR (auth.uid() IS NOT NULL AND created_by = auth.uid())
);

-- =========================================================
-- 4. POSTS: serving_suggestions + steps_label
-- =========================================================
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS serving_suggestions TEXT,
  ADD COLUMN IF NOT EXISTS steps_label TEXT;

-- =========================================================
-- 5. MESSAGES: reply-to support
-- =========================================================
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;

-- =========================================================
-- 6. EVENTS
-- =========================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  cover_image_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by everyone"
ON public.events FOR SELECT TO public USING (true);

CREATE POLICY "Cofounders create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders update events"
ON public.events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders delete events"
ON public.events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'cofounder'));

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 7. ANNOUNCEMENTS
-- =========================================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,  -- NULL = global
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Announcements viewable by everyone"
ON public.announcements FOR SELECT TO public USING (true);

CREATE POLICY "Cofounders create announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders delete announcements"
ON public.announcements FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'cofounder'));

-- =========================================================
-- 8. MERCH
-- =========================================================
CREATE TABLE public.merch_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_kes NUMERIC(10,2) NOT NULL CHECK (price_kes >= 0),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products viewable by everyone"
ON public.merch_products FOR SELECT TO public USING (active = true OR public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders create products"
ON public.merch_products FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders update products"
ON public.merch_products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders delete products"
ON public.merch_products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'cofounder'));

CREATE TRIGGER trg_merch_products_updated_at
BEFORE UPDATE ON public.merch_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.merch_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own cart"
ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add to their own cart"
ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own cart"
ON public.cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete from their own cart"
ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for merch images
INSERT INTO storage.buckets (id, name, public)
VALUES ('merch-images', 'merch-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Merch images public read"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'merch-images');

CREATE POLICY "Cofounders upload merch images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'merch-images' AND public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders update merch images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'merch-images' AND public.has_role(auth.uid(), 'cofounder'));

CREATE POLICY "Cofounders delete merch images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'merch-images' AND public.has_role(auth.uid(), 'cofounder'));
