import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Camera, Lock, Info } from "lucide-react";

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [verse, setVerse] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setOriginalUsername(profile.username);
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setVerse(profile.favorite_verse ?? "");
      setAvatarPreview(profile.avatar_url ?? null);
    }
  }, [profile]);

  const usernameLocked = !!profile?.username_changed_at;

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { toast({ title: "Image too large", description: "Max 3 MB", variant: "destructive" }); return; }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const validateUsername = (v: string) => /^[a-zA-Z0-9_]{3,20}$/.test(v);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanUsername = username.trim();
    const usernameChanged = cleanUsername !== originalUsername;
    if (usernameChanged) {
      if (usernameLocked) { toast({ title: "Username already changed", description: "You can only change your username once.", variant: "destructive" }); return; }
      if (!validateUsername(cleanUsername)) { toast({ title: "Invalid username", description: "3–20 chars; letters, numbers, underscore.", variant: "destructive" }); return; }
    }
    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      }
      const update: any = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        favorite_verse: verse.trim() || null,
        avatar_url: avatarUrl,
      };
      if (usernameChanged) update.username = cleanUsername;
      const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: "Profile saved" });
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader eyebrow="Your space" title="My profile" description="Personalize how the community sees you." />
        <section className="container py-8 lg:py-12 max-w-2xl">
          <form onSubmit={save} className="space-y-5">
            <div className="flex items-center gap-5">
              <label className="relative h-20 w-20 rounded-full bg-secondary grid place-items-center cursor-pointer overflow-hidden ring-2 ring-border">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-serif text-2xl text-primary">{(username || "U").charAt(0).toUpperCase()}</span>
                )}
                <span className="absolute inset-0 grid place-items-center bg-primary/0 hover:bg-primary/40 transition-smooth text-primary-foreground opacity-0 hover:opacity-100">
                  <Camera className="h-5 w-5" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </label>
              <div className="min-w-0">
                <p className="font-serif text-xl text-primary truncate">@{username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {profile?.full_name && <p className="text-xs text-muted-foreground truncate">{profile.full_name}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="flex items-center gap-1.5">
                  Username
                  {usernameLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="username"
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={usernameLocked}
                  placeholder="3–20 chars, letters/numbers/_"
                />
                <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  {usernameLocked ? "You've already used your one-time username change." : "You can change your username once. Choose carefully."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="display">Display name</Label>
                <Input id="display" value={displayName} maxLength={50} onChange={(e) => setDisplayName(e.target.value)} placeholder="What people see in feeds" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={profile?.full_name ?? ""} disabled />
              <p className="text-[11px] text-muted-foreground">Set when you signed up. Contact us to change.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A line or two about you…" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verse">Favourite verse</Label>
              <Textarea id="verse" value={verse} maxLength={300} onChange={(e) => setVerse(e.target.value)} rows={2} placeholder="e.g. 3 John 1:2 — Beloved, I wish above all things that thou mayest prosper and be in health…" />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="hero" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
