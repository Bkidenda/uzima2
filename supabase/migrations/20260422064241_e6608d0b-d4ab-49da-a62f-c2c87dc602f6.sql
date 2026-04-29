-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.post_kind AS ENUM ('article', 'recipe', 'devotion');
CREATE TYPE public.community_role AS ENUM ('owner', 'member');
CREATE TYPE public.conversation_kind AS ENUM ('direct', 'group');

-- =========================================
-- POSTS
-- =========================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.post_kind NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  cover_image_url TEXT,
  category TEXT,
  read_time TEXT,
  -- recipe-specific
  ingredients TEXT[],
  steps TEXT[],
  health_note TEXT,
  faith_reflection TEXT,
  -- devotion-specific
  verse TEXT,
  takeaway TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_kind_created ON public.posts(kind, created_at DESC);
CREATE INDEX idx_posts_author ON public.posts(author_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update their posts"
  ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete their posts"
  ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- POST LIKES
-- =========================================
CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their likes"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- POST COMMENTS
-- =========================================
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post ON public.post_comments(post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone"
  ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment"
  ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete their comments"
  ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- =========================================
-- COMMUNITIES
-- =========================================
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update their communities"
  ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Owners can delete their communities"
  ON public.communities FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TRIGGER communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- COMMUNITY MEMBERS
-- =========================================
CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.community_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships are viewable by everyone"
  ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Helper: is user a member of community?
CREATE OR REPLACE FUNCTION public.is_community_member(_community_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id AND user_id = _user_id
  );
$$;

-- Auto-add creator as owner-member
CREATE OR REPLACE FUNCTION public.add_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_add_owner_member
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_owner();

-- =========================================
-- CONVERSATIONS & MESSAGES
-- =========================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.conversation_kind NOT NULL,
  title TEXT,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_conv_community ON public.conversations(community_id) WHERE community_id IS NOT NULL;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Helper: is user participant?
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conv_id AND user_id = _user_id
  );
$$;

-- Helper: can user access conversation? (participant OR community member for group convs)
CREATE OR REPLACE FUNCTION public.can_access_conversation(_conv_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conv_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.community_members cm ON cm.community_id = c.community_id
    WHERE c.id = _conv_id AND cm.user_id = _user_id
  );
$$;

-- Conversations policies
CREATE POLICY "Participants and community members can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.can_access_conversation(id, auth.uid()));
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Participants policies
CREATE POLICY "Users can view participants of accessible conversations"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id, auth.uid()));
CREATE POLICY "Users can add themselves to a conversation"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Conversation creators can add participants"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  ));
CREATE POLICY "Users can leave conversations"
  ON public.conversation_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv_created ON public.messages(conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accessible-conversation members can view messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.can_access_conversation(conversation_id, auth.uid()));
CREATE POLICY "Accessible-conversation members can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.can_access_conversation(conversation_id, auth.uid())
  );

-- Auto-create group conversation when a community is created
CREATE OR REPLACE FUNCTION public.create_community_chat()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.conversations (kind, title, community_id, created_by)
  VALUES ('group', NEW.name, NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;
CREATE TRIGGER community_chat_create
  AFTER INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.create_community_chat();

-- =========================================
-- REALTIME
-- =========================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;

-- =========================================
-- STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('community-covers', 'community-covers', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Post images are public"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated users can upload post images to their folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Community covers are public"
  ON storage.objects FOR SELECT USING (bucket_id = 'community-covers');
CREATE POLICY "Authenticated users can upload community covers to their folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own community covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'community-covers' AND auth.uid()::text = (storage.foldername(name))[1]);