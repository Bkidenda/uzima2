
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  author uuid; liker_name text; post_title text;
BEGIN
  SELECT author_id, title INTO author, post_title FROM public.posts WHERE id = NEW.post_id;
  IF author IS NULL OR author = NEW.user_id THEN RETURN NEW; END IF;
  SELECT coalesce(display_name, username) INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (author, NEW.user_id, 'post_like', coalesce(liker_name,'Someone') || ' liked your post',
          post_title, '/posts/' || NEW.post_id::text, NEW.post_id);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  author uuid; commenter_name text; post_title text;
BEGIN
  SELECT author_id, title INTO author, post_title FROM public.posts WHERE id = NEW.post_id;
  IF author IS NULL OR author = NEW.author_id THEN RETURN NEW; END IF;
  SELECT coalesce(display_name, username) INTO commenter_name FROM public.profiles WHERE id = NEW.author_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  VALUES (author, NEW.author_id, 'post_comment', coalesce(commenter_name,'Someone') || ' commented on your post',
          left(NEW.body, 140), '/posts/' || NEW.post_id::text, NEW.post_id);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_new_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE author_name text;
BEGIN
  SELECT coalesce(display_name, username) INTO author_name FROM public.profiles WHERE id = NEW.author_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, link, related_id)
  SELECT f.follower_id, NEW.author_id, 'new_post_from_following',
         coalesce(author_name,'Someone') || ' posted: ' || NEW.title,
         left(coalesce(NEW.excerpt, NEW.body, ''), 180),
         '/posts/' || NEW.id::text, NEW.id
  FROM public.follows f WHERE f.followee_id = NEW.author_id;
  RETURN NEW;
END $$;
