
-- 1) profiles: track username change
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;

-- 2) follows
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL,
  followee_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_followee ON public.follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);

-- 3) notifications
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'post_like','post_comment','follow','new_message','announcement','new_post_from_following'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  related_id uuid,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 4) Trigger functions
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  author uuid;
  liker_name text;
  post_title text;
BEGIN
  SELECT author_id, title INTO author, post_title FROM public.posts WHERE id = NEW.post_id;
  IF author IS NULL OR author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT coalesce(display_name, username) INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (author, NEW.user_id, 'post_like', coalesce(liker_name,'Someone') || ' liked your post',
          post_title, '/post/' || NEW.post_id::text, NEW.post_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_post_like ON public.post_likes;
CREATE TRIGGER trg_notify_post_like AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  author uuid;
  commenter_name text;
  post_title text;
BEGIN
  SELECT author_id, title INTO author, post_title FROM public.posts WHERE id = NEW.post_id;
  IF author IS NULL OR author = NEW.author_id THEN RETURN NEW; END IF;
  SELECT coalesce(display_name, username) INTO commenter_name FROM public.profiles WHERE id = NEW.author_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (author, NEW.author_id, 'post_comment', coalesce(commenter_name,'Someone') || ' commented on your post',
          left(NEW.body, 140), '/post/' || NEW.post_id::text, NEW.post_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.post_comments;
CREATE TRIGGER trg_notify_post_comment AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  follower_name text;
  follower_username text;
BEGIN
  SELECT coalesce(display_name, username), username INTO follower_name, follower_username
  FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, link, related_id)
  VALUES (NEW.followee_id, NEW.follower_id, 'follow',
          coalesce(follower_name,'Someone') || ' started following you',
          '/u/' || coalesce(follower_username,''), NEW.follower_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_follow();

CREATE OR REPLACE FUNCTION public.notify_announcement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT p.id, NEW.created_by, 'announcement', NEW.title, left(NEW.body, 200),
         '/announcements', NEW.id
  FROM public.profiles p
  WHERE p.id <> NEW.created_by;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.announcements;
CREATE TRIGGER trg_notify_announcement AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_announcement();

CREATE OR REPLACE FUNCTION public.notify_new_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  author_name text;
BEGIN
  SELECT coalesce(display_name, username) INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT f.follower_id, NEW.author_id, 'new_post_from_following',
         coalesce(author_name,'Someone') || ' posted: ' || NEW.title,
         left(coalesce(NEW.excerpt, NEW.body, ''), 180),
         '/post/' || NEW.id::text, NEW.id
  FROM public.follows f WHERE f.followee_id = NEW.author_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_post ON public.posts;
CREATE TRIGGER trg_notify_new_post AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_post();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  conv record;
  sender_name text;
  recipient uuid;
  community_name text;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  SELECT coalesce(display_name, username) INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  IF conv.kind = 'direct' THEN
    SELECT user_id INTO recipient FROM public.conversation_participants
      WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id LIMIT 1;
    IF recipient IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
      VALUES (recipient, NEW.sender_id, 'new_message',
              coalesce(sender_name,'Someone') || ' sent you a message',
              left(NEW.body, 160), '/messages/' || NEW.conversation_id::text, NEW.conversation_id);
    END IF;
  ELSIF conv.kind = 'group' AND conv.community_id IS NOT NULL THEN
    SELECT name INTO community_name FROM public.communities WHERE id = conv.community_id;
    INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
    SELECT cm.user_id, NEW.sender_id, 'new_message',
           coalesce(sender_name,'Someone') || ' in ' || coalesce(community_name,'a community'),
           left(NEW.body, 160), '/messages/' || NEW.conversation_id::text, NEW.conversation_id
    FROM public.community_members cm
    WHERE cm.community_id = conv.community_id AND cm.user_id <> NEW.sender_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 5) Username one-time change enforcement
CREATE OR REPLACE FUNCTION public.enforce_username_change_once()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF OLD.username_changed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Username can only be changed once';
    END IF;
    NEW.username_changed_at := now();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_username_change_once ON public.profiles;
CREATE TRIGGER trg_username_change_once BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_username_change_once();

-- 6) Update handle_new_user to capture full_name from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  desired_username text;
  final_username text;
  display text;
  fullname text;
BEGIN
  desired_username := NEW.raw_user_meta_data ->> 'username';
  IF desired_username IS NULL OR length(trim(desired_username)) = 0 THEN
    desired_username := split_part(NEW.email, '@', 1);
  END IF;
  final_username := public.generate_unique_username(desired_username);
  fullname := NEW.raw_user_meta_data ->> 'full_name';
  display := coalesce(NEW.raw_user_meta_data ->> 'display_name', fullname, final_username);
  INSERT INTO public.profiles (id, username, display_name, full_name)
  VALUES (NEW.id, final_username, display, fullname);
  RETURN NEW;
END $$;
