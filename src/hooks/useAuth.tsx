import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  favorite_verse: string | null;
  username_changed_at: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  isCofounder: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const [profRes, rolesRes] = await Promise.all([
      (supabase as any)
        .from("profiles")
        .select("id, username, display_name, full_name, bio, avatar_url, favorite_verse, username_changed_at")
        .eq("id", userId)
        .maybeSingle(),
      (supabase as any).from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((profRes.data as any) ?? null);
    setRoles(((rolesRes.data ?? []) as any[]).map((r) => r.role));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const isCofounder = roles.includes("cofounder") || roles.includes("admin");
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, isCofounder, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
