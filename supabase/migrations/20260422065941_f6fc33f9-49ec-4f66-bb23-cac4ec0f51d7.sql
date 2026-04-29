
-- 1. RPC to atomically get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  existing uuid;
  new_conv uuid;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _other_user_id IS NULL OR _other_user_id = me THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  -- Look for an existing direct conversation between the two users
  SELECT c.id INTO existing
  FROM public.conversations c
  WHERE c.kind = 'direct'
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants p
      WHERE p.conversation_id = c.id AND p.user_id = me
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants p
      WHERE p.conversation_id = c.id AND p.user_id = _other_user_id
    )
  LIMIT 1;

  IF existing IS NOT NULL THEN
    RETURN existing;
  END IF;

  INSERT INTO public.conversations (kind, created_by)
  VALUES ('direct', me)
  RETURNING id INTO new_conv;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (new_conv, me), (new_conv, _other_user_id);

  RETURN new_conv;
END;
$$;

-- 2. Community invites
CREATE TABLE public.community_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, invitee_id)
);
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can create invites"
ON public.community_invites FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = inviter_id AND EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_invites.community_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Owners and invitees can view invites"
ON public.community_invites FOR SELECT TO authenticated
USING (
  auth.uid() = invitee_id OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_invites.community_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Invitees can update their invite"
ON public.community_invites FOR UPDATE TO authenticated
USING (auth.uid() = invitee_id);

CREATE POLICY "Owners or invitees can delete invites"
ON public.community_invites FOR DELETE TO authenticated
USING (
  auth.uid() = invitee_id OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_invites.community_id AND c.created_by = auth.uid()
  )
);

-- 3. Community join requests
CREATE TABLE public.community_join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can request to join"
ON public.community_join_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and owners can view requests"
ON public.community_join_requests FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_join_requests.community_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Owners can update requests"
ON public.community_join_requests FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_join_requests.community_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Users can cancel their request"
ON public.community_join_requests FOR DELETE TO authenticated
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_join_requests.community_id AND c.created_by = auth.uid()
  )
);

-- 4. RPC for owner to approve a join request: adds member + marks request approved
CREATE OR REPLACE FUNCTION public.approve_join_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req record;
BEGIN
  SELECT r.*, c.created_by AS owner_id
  INTO req
  FROM public.community_join_requests r
  JOIN public.communities c ON c.id = r.community_id
  WHERE r.id = _request_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.owner_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (req.community_id, req.user_id, 'member')
  ON CONFLICT DO NOTHING;

  UPDATE public.community_join_requests
  SET status = 'approved'
  WHERE id = _request_id;
END;
$$;

-- 5. RPC to accept an invite: invitee becomes a member
CREATE OR REPLACE FUNCTION public.accept_community_invite(_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv record;
BEGIN
  SELECT * INTO inv FROM public.community_invites WHERE id = _invite_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF inv.invitee_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;

  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (inv.community_id, auth.uid(), 'member')
  ON CONFLICT DO NOTHING;

  UPDATE public.community_invites SET status = 'accepted' WHERE id = _invite_id;
END;
$$;
