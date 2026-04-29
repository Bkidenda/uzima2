import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, Loader2 } from "lucide-react";
import type { PostKind } from "@/lib/posts";

interface Props { mode: "create" | "edit"; }

const PostEditor = ({ mode }: Props) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const initialKind = (params.get("kind") as PostKind) || "article";

  const [kind, setKind] = useState<PostKind>(initialKind);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [readTime, setReadTime] = useState("");
  const [verse, setVerse] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [stepsLabel, setStepsLabel] = useState("Steps");
  const [servingSuggestions, setServingSuggestions] = useState("");
  const [healthNote, setHealthNote] = useState("");
  const [faithReflection, setFaithReflection] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrating, setHydrating] = useState(mode === "edit");

  useEffect(() => { if (!loading && !user) navigate("/auth", { replace: true }); }, [loading, user, navigate]);

  useEffect(() => {
    if (mode !== "edit" || !id || !user) return;
    (async () => {
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast({ title: "Post not found", variant: "destructive" }); navigate("/my-materials"); return; }
      if (data.author_id !== user.id) { toast({ title: "Not your post", variant: "destructive" }); navigate("/my-materials"); return; }
      const p: any = data;
      setKind(p.kind);
      setTitle(p.title || "");
      setExcerpt(p.excerpt || "");
      setBody(p.body || "");
      setCategory(p.category || "");
      setReadTime(p.read_time || "");
      setVerse(p.verse || "");
      setTakeaway(p.takeaway || "");
      setIngredients((p.ingredients || []).join("\n"));
      setSteps((p.steps || []).join("\n"));
      setStepsLabel(p.steps_label || "Steps");
      setServingSuggestions(p.serving_suggestions || "");
      setHealthNote(p.health_note || "");
      setFaithReflection(p.faith_reflection || "");
      setCoverPreview(p.cover_image_url || null);
      setHydrating(false);
    })();
  }, [mode, id, user?.id, navigate]);

  const onPickCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Image too large", description: "Under 5 MB please", variant: "destructive" }); return; }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      let coverUrl: string | null = coverPreview;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-images").upload(path, coverFile);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("post-images").getPublicUrl(path);
        coverUrl = pub.publicUrl;
      }

      const payload: any = {
        kind,
        title: title.trim(),
        excerpt: excerpt.trim() || null,
        body: body.trim() || null,
        cover_image_url: coverUrl,
        category: category.trim() || null,
        read_time: readTime.trim() || null,
        verse: null,
        takeaway: null,
        ingredients: null,
        steps: null,
        steps_label: null,
        serving_suggestions: null,
        health_note: null,
        faith_reflection: null,
      };
      if (kind === "recipe") {
        payload.ingredients = ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
        payload.steps = steps.split("\n").map((s) => s.trim()).filter(Boolean);
        payload.steps_label = stepsLabel.trim() || "Steps";
        payload.serving_suggestions = servingSuggestions.trim() || null;
        payload.health_note = healthNote.trim() || null;
        payload.faith_reflection = faithReflection.trim() || null;
      }
      if (kind === "devotion") {
        payload.verse = verse.trim() || null;
        payload.takeaway = takeaway.trim() || null;
      }

      let postId: string;
      if (mode === "edit" && id) {
        const { error } = await supabase.from("posts").update(payload).eq("id", id);
        if (error) throw error;
        postId = id;
        toast({ title: "Updated" });
      } else {
        payload.author_id = user.id;
        const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
        if (error) throw error;
        postId = data.id;
        toast({ title: "Posted!", description: "Your contribution is live." });
      }
      navigate(`/posts/${postId}`);
    } catch (err: any) {
      toast({ title: "Couldn't save", description: err.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || hydrating) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader
          eyebrow={mode === "edit" ? "Edit" : "Share"}
          title={mode === "edit" ? "Edit your contribution." : "Contribute to Uzima."}
          description="Share a recipe, devotion, or article that nourishes the body and spirit."
        />
        <section className="container py-8 lg:py-12">
          <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5">
            <Tabs value={kind} onValueChange={(v) => setKind(v as PostKind)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="article" disabled={mode === "edit"}>Article</TabsTrigger>
                <TabsTrigger value="recipe" disabled={mode === "edit"}>Recipe</TabsTrigger>
                <TabsTrigger value="devotion" disabled={mode === "edit"}>Devotion</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Cover image (optional)</Label>
              <label className="flex items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed border-border bg-card hover:bg-secondary/40 cursor-pointer transition-smooth overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} alt="cover preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center text-muted-foreground text-sm"><ImagePlus className="h-6 w-6 mb-1" /> Click to upload</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={onPickCover} />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={category} maxLength={40} onChange={(e) => setCategory(e.target.value)} placeholder={kind === "recipe" ? "Lunch, Snack…" : kind === "devotion" ? "Faith, Hope…" : "Health, Lifestyle…"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="readTime">{kind === "recipe" ? "Cook time" : "Read time"}</Label>
                <Input id="readTime" value={readTime} maxLength={30} onChange={(e) => setReadTime(e.target.value)} placeholder={kind === "recipe" ? "30 min" : "4 min read"} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Short summary</Label>
              <Textarea id="excerpt" value={excerpt} maxLength={280} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
            </div>

            {kind === "devotion" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verse">Bible verse</Label>
                  <Input id="verse" value={verse} maxLength={200} onChange={(e) => setVerse(e.target.value)} placeholder="3 John 1:2 — Beloved, I wish above…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeaway">Today's takeaway</Label>
                  <Textarea id="takeaway" value={takeaway} maxLength={500} onChange={(e) => setTakeaway(e.target.value)} rows={2} />
                </div>
              </>
            )}

            {kind === "recipe" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ingredients">Ingredients (one per line)</Label>
                  <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={5} placeholder={"1 cup red lentils\n2 sweet potatoes, cubed"} />
                </div>
                <div className="grid sm:grid-cols-[1fr_2fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stepsLabel">Section name</Label>
                    <Input id="stepsLabel" value={stepsLabel} maxLength={30} onChange={(e) => setStepsLabel(e.target.value)} placeholder="Steps / Method / Directions…" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="steps">{stepsLabel || "Steps"} (one per line)</Label>
                    <Textarea id="steps" value={steps} onChange={(e) => setSteps(e.target.value)} rows={5} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serving">Serving suggestions (optional)</Label>
                  <Textarea id="serving" value={servingSuggestions} maxLength={500} onChange={(e) => setServingSuggestions(e.target.value)} rows={3} placeholder="Pair with brown rice, garnish with fresh coriander…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="healthNote">My tips (optional)</Label>
                  <Textarea id="healthNote" value={healthNote} maxLength={500} onChange={(e) => setHealthNote(e.target.value)} rows={2} placeholder="Personal tips, swaps, or notes from making this dish…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faithReflection">Faith reflection (optional)</Label>
                  <Input id="faithReflection" value={faithReflection} maxLength={200} onChange={(e) => setFaithReflection(e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>{kind === "recipe" ? "Notes (optional)" : "Body"}</Label>
              <RichTextEditor value={body} onChange={setBody} placeholder="Write here…" rows={kind === "recipe" ? 4 : 10} />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" asChild>
                <Link to={mode === "edit" ? "/my-materials" : "/dashboard"}>Cancel</Link>
              </Button>
              <Button type="submit" variant="hero" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Saving…" : mode === "edit" ? "Save changes" : "Publish"}
              </Button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PostEditor;
