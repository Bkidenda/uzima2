import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Leaf, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  fullName: z.string().trim().min(2, "Please share your full name").max(80),
  username: z
    .string()
    .trim()
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_]*$/, "Letters, numbers, underscore only")
    .optional()
    .or(z.literal("")),
});

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password required"),
});

const generateUsername = () => {
  const adj = ["sunny", "gentle", "joyful", "humble", "bright", "kind", "graceful", "noble"];
  const noun = ["seed", "sparrow", "olive", "lily", "river", "psalm", "harvest", "dove"];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = noun[Math.floor(Math.random() * noun.length)];
  return `${a}_${n}${Math.floor(Math.random() * 900 + 100)}`;
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
    <path fill="#4285F4" d="M21.6 12.227c0-.708-.063-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.74 2.982-4.305 2.982-7.351z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.896.6-2.041.955-3.386.955-2.604 0-4.81-1.76-5.595-4.122H3.064v2.59A9.997 9.997 0 0 0 12 22z"/>
    <path fill="#FBBC05" d="M6.405 13.901A6.018 6.018 0 0 1 6.09 12c0-.661.114-1.302.314-1.901V7.509H3.064A9.997 9.997 0 0 0 2 12c0 1.614.387 3.14 1.064 4.491l3.341-2.59z"/>
    <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.96 2.99 14.696 2 12 2 8.067 2 4.67 4.255 3.064 7.509l3.341 2.59C7.19 7.737 9.395 5.977 12 5.977z"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ email, password, fullName, username });
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const finalUsername = (username.trim() || generateUsername());
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          username: finalUsername,
          display_name: finalUsername,
          full_name: parsed.data.fullName,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't create account", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome to Uzima 🌿", description: `Your username is @${finalUsername}` });
    navigate("/dashboard", { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: signInEmail, password: signInPassword });
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const handleGoogle = async () => {
    setGoogleBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result?.error) {
      toast({ title: "Couldn't sign in with Google", description: String(result.error?.message ?? result.error), variant: "destructive" });
      setGoogleBusy(false);
      return;
    }
    if (!result?.redirected) {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col">
      <header className="container py-5">
        <Link to="/" className="inline-flex items-center gap-2 font-serif text-xl font-semibold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          Uzima
        </Link>
      </header>

      <main className="flex-1 grid place-items-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl bg-card shadow-warm ring-1 ring-border/60 p-7">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="h-3 w-3 text-accent" />
              Join the community
            </span>
            <h1 className="mt-3 font-serif text-3xl text-primary">Welcome to Uzima</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Nourish body and spirit, together.</p>
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full mb-4" onClick={handleGoogle} disabled={googleBusy}>
            <GoogleIcon />
            {googleBusy ? "Connecting…" : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signup">Create account</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Full name</Label>
                  <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Mary Wanjiku" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username">Username <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <button
                      type="button"
                      onClick={() => setUsername(generateUsername())}
                      className="text-xs text-accent hover:underline"
                    >
                      Generate one
                    </button>
                  </div>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Leave blank to auto-generate" />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Creating..." : "Join Uzima"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-password">Password</Label>
                  <Input id="si-password" type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} required />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  {busy ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Auth;
