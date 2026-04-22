"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { BlogPost, SocialPost, WeekPackage } from "@/types/database";
import { Sparkles, Copy, Check, Loader2, FileText, Share2, Package, ChevronDown, ChevronUp, Upload, X, CalendarDays, Wand2 } from "lucide-react";
import { MINT, SLATE, OUTLINE } from "@/lib/btn";
import { toast } from "sonner";
import { format } from "date-fns";

type GeneratedBlog = BlogPost & { justGenerated?: boolean };
type GeneratedSocial = SocialPost & { generatingImage?: boolean };
type RefineState = { open: boolean; value: string; loading: boolean };

const PLATFORMS = ["linkedin", "instagram", "facebook"] as const;
const platformColor: Record<string, string> = {
  linkedin: "#0a66c2", instagram: "#e1306c", facebook: "#1877f2",
};
const platformBg: Record<string, string> = {
  linkedin: "rgba(10,102,194,0.12)", instagram: "rgba(225,48,108,0.12)", facebook: "rgba(24,119,242,0.12)",
};
const inputStyle = {
  backgroundColor: "var(--canvas)",
  boxShadow: "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.04) 0px 1px 3px 0px",
  border: "none",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
};

export default function GeneratePage() {
  const supabase = createClient();

  // Packages for assignment dropdown
  const [packages, setPackages] = useState<WeekPackage[]>([]);

  // Blog state
  const [blogTopic, setBlogTopic] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogs, setBlogs] = useState<GeneratedBlog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedBlogs, setExpandedBlogs] = useState<Record<string, boolean>>({});
  const [refine, setRefine] = useState<Record<string, RefineState>>({});

  // Social state
  const [socialTopic, setSocialTopic] = useState("");
  const [socialTheme, setSocialTheme] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "instagram", "facebook"]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socials, setSocials] = useState<GeneratedSocial[]>([]);
  const [socialsLoading, setSocialsLoading] = useState(true);

  // Week plan state
  const [weekStart, setWeekStart] = useState("");
  const [weekPlan, setWeekPlan] = useState<any>(null);
  const [weekLoading, setWeekLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [weekProgress, setWeekProgress] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: pkgs }, { data: b }, { data: s }] = await Promise.all([
      supabase.from("week_packages").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_posts").select("*").eq("status", "draft").order("created_at", { ascending: false }).limit(20),
      supabase.from("social_posts").select("*").eq("status", "draft").order("created_at", { ascending: false }).limit(30),
    ]);
    setPackages((pkgs as WeekPackage[]) ?? []);
    setBlogs((b as GeneratedBlog[]) ?? []);
    setSocials((s as GeneratedSocial[]) ?? []);
    setBlogsLoading(false);
    setSocialsLoading(false);
  }

  // ── Package assignment ──────────────────────────────────────────────────────

  async function assignToPackage(type: "blog" | "social", id: string, packageId: string) {
    const table = type === "blog" ? "blog_posts" : "social_posts";
    const { error } = await supabase.from(table).update({ week_package_id: packageId }).eq("id", id);
    if (error) { toast.error("Failed to assign"); return; }
    const pkgLabel = packages.find((p) => p.id === packageId)?.week_label ?? "package";
    toast.success(`Added to ${pkgLabel}`);
    if (type === "blog") setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, week_package_id: packageId } : b));
    else setSocials((prev) => prev.map((s) => s.id === id ? { ...s, week_package_id: packageId } : s));
  }

  async function schedulePost(type: "blog" | "social", id: string, date: string) {
    const table = type === "blog" ? "blog_posts" : "social_posts";
    await supabase.from(table).update({ scheduled_date: date || null }).eq("id", id);
    if (type === "blog") setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, scheduled_date: date || null } : b));
    else setSocials((prev) => prev.map((s) => s.id === id ? { ...s, scheduled_date: date || null } : s));
    if (date) toast.success("Scheduled");
  }

  function toggleRefine(id: string) {
    setRefine((p) => ({ ...p, [id]: p[id]?.open ? { open: false, value: "", loading: false } : { open: true, value: "", loading: false } }));
  }

  async function applyRefine(type: "blog" | "social", id: string) {
    const r = refine[id];
    if (!r?.value.trim()) return;
    setRefine((p) => ({ ...p, [id]: { ...p[id], loading: true } }));
    try {
      const currentContent = type === "blog"
        ? blogs.find((b) => b.id === id)
        : socials.find((s) => s.id === id);
      const res = await fetch("/api/refine-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, instructions: r.value, currentContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (type === "blog") setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, ...data } : b));
      else setSocials((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
      setRefine((p) => ({ ...p, [id]: { open: false, value: "", loading: false } }));
      toast.success("Content updated");
    } catch (e: any) {
      toast.error(e.message || "Refinement failed");
      setRefine((p) => ({ ...p, [id]: { ...p[id], loading: false } }));
    }
  }

  async function removeFromPackage(type: "blog" | "social", id: string) {
    const table = type === "blog" ? "blog_posts" : "social_posts";
    await supabase.from(table).update({ week_package_id: null }).eq("id", id);
    if (type === "blog") setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, week_package_id: null } : b));
    else setSocials((prev) => prev.map((s) => s.id === id ? { ...s, week_package_id: null } : s));
  }

  async function uploadImage(postId: string, file: File) {
    setSocials((prev) => prev.map((s) => s.id === postId ? { ...s, generatingImage: true } : s));
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("postId", postId);
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSocials((prev) => prev.map((s) => s.id === postId ? { ...s, image_url: data.image_url, generatingImage: false } : s));
      toast.success("Image uploaded");
    } catch (e: any) {
      setSocials((prev) => prev.map((s) => s.id === postId ? { ...s, generatingImage: false } : s));
      toast.error(e.message || "Upload failed");
    }
  }

  // ── Blog generation ─────────────────────────────────────────────────────────

  async function generateBlog() {
    if (!blogTopic.trim()) { toast.error("Enter a topic first"); return; }
    setBlogLoading(true);
    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: blogTopic, keywords: blogKeywords }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Auto-save immediately
      const saveRes = await fetch("/api/save-blog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error);

      setBlogs((prev) => [{ ...saved, justGenerated: true }, ...prev]);
      setBlogTopic(""); setBlogKeywords("");
      toast.success("Blog post generated and saved");
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setBlogLoading(false); }
  }

  async function copyHTML(blog: GeneratedBlog) {
    await navigator.clipboard.writeText(blog.content_html);
    setCopied(blog.id); toast.success("HTML copied — paste directly into WordPress");
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Social generation ───────────────────────────────────────────────────────

  async function generateSocial() {
    if (!socialTopic.trim()) { toast.error("Enter a topic first"); return; }
    setSocialLoading(true);
    try {
      const results = await Promise.all(
        selectedPlatforms.map(async (platform) => {
          const res = await fetch("/api/generate-social", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform, topic: socialTopic, weekTheme: socialTheme }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          // Auto-save immediately
          const saveRes = await fetch("/api/save-social", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...data, platform }),
          });
          const saved = await saveRes.json();
          if (!saveRes.ok) throw new Error(saved.error);
          return { ...saved, generatingImage: !!data.image_prompt };
        })
      );

      setSocials((prev) => [...results, ...prev]);
      setSocialTopic(""); setSocialTheme("");
      toast.success(`${results.length} posts generated and saved`);

      // Generate images in background — update DB + UI when ready
      results.forEach(async (post) => {
        if (!post.image_prompt) return;
        try {
          const imgRes = await fetch("/api/generate-image", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imagePrompt: post.image_prompt, platform: post.platform, postId: post.id }),
          });
          const imgData = await imgRes.json();
          setSocials((prev) => prev.map((s) =>
            s.id === post.id ? { ...s, image_url: imgData.image_url ?? null, generatingImage: false } : s
          ));
        } catch {
          setSocials((prev) => prev.map((s) =>
            s.id === post.id ? { ...s, generatingImage: false } : s
          ));
        }
      });
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setSocialLoading(false); }
  }

  // ── Full week generation ────────────────────────────────────────────────────

  async function generateWeekPlan() {
    if (!weekStart) { toast.error("Select a week start date"); return; }
    setWeekLoading(true);
    try {
      const res = await fetch("/api/generate-week", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWeekPlan(data);
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setWeekLoading(false); }
  }

  async function generateAllFromPlan() {
    if (!weekPlan) return;
    setGeneratingAll(true);
    let blogCount = 0;
    let socialCount = 0;
    const { blog_topics, social_topics, week_theme } = weekPlan;
    const total = blog_topics.length + social_topics.length;

    try {
      // Generate blogs one at a time
      for (let i = 0; i < blog_topics.length; i++) {
        const { topic, keywords } = blog_topics[i];
        setWeekProgress(`Blog ${i + 1} of ${blog_topics.length}…`);
        const genRes = await fetch("/api/generate-blog", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, keywords }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);
        const saveRes = await fetch("/api/save-blog", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(genData),
        });
        if (saveRes.ok) blogCount++;
      }

      // Generate social posts one at a time
      for (let i = 0; i < social_topics.length; i++) {
        const { platform, topic } = social_topics[i];
        setWeekProgress(`Social post ${i + 1} of ${social_topics.length}…`);
        const genRes = await fetch("/api/generate-social", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, topic, weekTheme: week_theme }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error);
        const saveRes = await fetch("/api/save-social", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...genData, platform }),
        });
        if (saveRes.ok) socialCount++;
      }

      toast.success(`Generated ${blogCount} blogs + ${socialCount} social posts — all saved`);
      setWeekPlan(null);
      await loadAll();
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setGeneratingAll(false); setWeekProgress(""); }
  }

  // ── Package selector component ──────────────────────────────────────────────

  function PackageSelector({ type, id, currentPackageId }: { type: "blog" | "social"; id: string; currentPackageId: string | null }) {
    const [open, setOpen] = useState(false);
    const assigned = packages.find((p) => p.id === currentPackageId);

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 label-mono rounded-full px-2.5 py-1 border transition-all"
          style={{
            fontSize: 9,
            borderColor: assigned ? "#111" : "rgba(0,0,0,0.15)",
            backgroundColor: assigned ? "#111" : "transparent",
            color: assigned ? "#fff" : "var(--text-muted)",
          }}
        >
          <Package className="w-3 h-3" />
          {assigned ? assigned.week_label.replace("Week of ", "") : "ADD TO PACKAGE"}
          <ChevronDown className="w-3 h-3" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 top-8 z-20 rounded-xl overflow-hidden min-w-52"
              style={{ backgroundColor: "#fff", boxShadow: "var(--shadow-card)" }}
            >
              {assigned && (
                <button
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-red-50"
                  style={{ color: "#b91c1c", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                  onClick={() => { removeFromPackage(type, id); setOpen(false); }}
                >
                  Remove from package
                </button>
              )}
              {packages.length === 0 && (
                <p className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>No packages yet — create one first</p>
              )}
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-gray-50"
                  style={{ color: pkg.id === currentPackageId ? "#111" : "#444" }}
                  onClick={() => { assignToPackage(type, id, pkg.id); setOpen(false); }}
                >
                  <span className="block font-medium">{pkg.week_label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {pkg.status.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const sectionCard = (children: React.ReactNode) => (
    <div className="vg-card p-6">{children}</div>
  );

  return (
    <div className="p-8">
      <div className="mb-10">
        <p className="label-kicker mb-2">Content</p>
        <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>Generate</h1>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          All generated content is saved automatically as drafts
        </p>
      </div>

      <Tabs defaultValue="blog">
        <TabsList className="mb-6 gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--surface-2)", boxShadow: "var(--shadow-sm)" }}>
          {[
            { value: "blog", label: "Blog Posts", Icon: FileText },
            { value: "social", label: "Social Posts", Icon: Share2 },
            { value: "week", label: "Full Week", Icon: Sparkles },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger key={value} value={value} className="rounded-lg data-active:bg-white data-active:text-[#111] text-[#898989]" style={{ fontSize: 13 }}>
              <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Blog Tab ── */}
        <TabsContent value="blog">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Generator */}
            <div className="lg:col-span-1">
              {sectionCard(
                <div className="space-y-4">
                  <p className="label-kicker">New Blog Post</p>
                  <div>
                    <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>TOPIC</Label>
                    <Input style={inputStyle} placeholder="e.g. How to choose exterior paint colors" value={blogTopic} onChange={(e) => setBlogTopic(e.target.value)} />
                  </div>
                  <div>
                    <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>TARGET KEYWORDS</Label>
                    <Input style={inputStyle} placeholder="exterior painting, house paint, curb appeal" value={blogKeywords} onChange={(e) => setBlogKeywords(e.target.value)} />
                  </div>
                  <button className={`${MINT} w-full justify-center gap-2`} onClick={generateBlog} disabled={blogLoading}>
                    {blogLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING & SAVING...</> : <><Sparkles className="w-4 h-4" /> GENERATE BLOG POST</>}
                  </button>
                </div>
              )}
            </div>

            {/* Saved blog drafts */}
            <div className="lg:col-span-2 space-y-3">
              <p className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                ALL BLOG DRAFTS ({blogs.length})
              </p>
              {blogsLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--mint)" }} /></div>}
              {!blogsLoading && blogs.length === 0 && (
                <div className="vg-card p-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No blog drafts yet — generate your first one</p>
                </div>
              )}
              {blogs.map((blog) => {
                const expanded = expandedBlogs[blog.id];
                return (
                  <div key={blog.id} className="vg-card overflow-hidden" style={blog.justGenerated ? { boxShadow: "var(--shadow-card), 0 0 0 2px #111" } : {}}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold leading-snug" style={{ fontSize: 14, color: "#111" }}>{blog.title}</h3>
                          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{blog.excerpt}</p>
                          <p className="mt-1.5 text-xs" style={{ color: "#444" }}>
                            {format(new Date(blog.created_at), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PackageSelector type="blog" id={blog.id} currentPackageId={blog.week_package_id} />
                          <button
                            className={`${OUTLINE} gap-1.5`}
                            onClick={() => copyHTML(blog)}
                          >
                            {copied === blog.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === blog.id ? "Copied" : "Copy HTML"}
                          </button>
                          <button
                            className={`${SLATE} gap-1.5`}
                            onClick={() => setExpandedBlogs((p) => ({ ...p, [blog.id]: !p[blog.id] }))}
                            style={{ padding: "6px 12px", fontSize: 12 }}
                          >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {expanded ? "Hide" : "Preview"}
                          </button>
                        </div>
                      </div>
                      {blog.seo_description && (
                        <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
                          <span className="font-semibold" style={{ color: "#111" }}>SEO: </span>{blog.seo_description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                          <input
                            type="date"
                            value={blog.scheduled_date ?? ""}
                            onChange={(e) => schedulePost("blog", blog.id, e.target.value)}
                            className="text-xs rounded-lg px-2 py-1 outline-none transition-colors"
                            style={{ backgroundColor: "var(--surface-2)", color: blog.scheduled_date ? "#111" : "var(--text-muted)", border: "none", fontSize: 11, cursor: "pointer" }}
                          />
                          {blog.scheduled_date && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eef2ff", color: "#4f46e5", fontSize: 10 }}>
                              Scheduled
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleRefine(blog.id)}
                          className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-[#111]"
                          style={{ color: refine[blog.id]?.open ? "#111" : "var(--text-muted)", fontSize: 11 }}
                        >
                          <Wand2 className="w-3 h-3" /> Refine
                        </button>
                      </div>
                      {refine[blog.id]?.open && (
                        <div className="flex gap-2 mt-2">
                          <input
                            autoFocus
                            className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
                            style={{ backgroundColor: "var(--surface-2)", border: "1px solid rgba(0,0,0,0.1)", color: "#111", fontSize: 12 }}
                            placeholder="e.g. Make it shorter, add more urgency, focus on emergency services…"
                            value={refine[blog.id]?.value ?? ""}
                            onChange={(e) => setRefine((p) => ({ ...p, [blog.id]: { ...p[blog.id], value: e.target.value } }))}
                            onKeyDown={(e) => e.key === "Enter" && applyRefine("blog", blog.id)}
                          />
                          <button
                            className={`${MINT} gap-1.5 shrink-0`}
                            style={{ fontSize: 11, padding: "6px 12px" }}
                            onClick={() => applyRefine("blog", blog.id)}
                            disabled={refine[blog.id]?.loading}
                          >
                            {refine[blog.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            {refine[blog.id]?.loading ? "Refining…" : "Apply"}
                          </button>
                        </div>
                      )}
                    </div>
                    {expanded && (
                      <div className="px-5 pb-5 pt-0">
                        <div
                          className="blog-prose rounded-lg p-5"
                          style={{ backgroundColor: "var(--surface-2)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
                          dangerouslySetInnerHTML={{ __html: blog.content_html }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ── Social Tab ── */}
        <TabsContent value="social">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Generator */}
            <div className="lg:col-span-1">
              {sectionCard(
                <div className="space-y-4">
                  <p className="label-kicker">New Social Post</p>
                  <div>
                    <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>TOPIC / ANGLE</Label>
                    <Input style={inputStyle} placeholder="Before & after cabinet repaint" value={socialTopic} onChange={(e) => setSocialTopic(e.target.value)} />
                  </div>
                  <div>
                    <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>WEEK THEME (OPTIONAL)</Label>
                    <Input style={inputStyle} placeholder="Spring Refresh Season" value={socialTheme} onChange={(e) => setSocialTheme(e.target.value)} />
                  </div>
                  <div>
                    <Label className="label-mono mb-2 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>PLATFORMS</Label>
                    <div className="flex gap-2">
                      {PLATFORMS.map((p) => (
                        <button key={p}
                          onClick={() => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                          className="label-mono px-3 py-1.5 rounded-full border transition-all"
                          style={{
                            fontSize: 9,
                            borderColor: selectedPlatforms.includes(p) ? platformColor[p] : "rgba(0,0,0,0.12)",
                            backgroundColor: selectedPlatforms.includes(p) ? platformBg[p] : "transparent",
                            color: selectedPlatforms.includes(p) ? platformColor[p] : "var(--text-muted)",
                          }}
                        >{p.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <button className={`${MINT} w-full justify-center gap-2`} onClick={generateSocial} disabled={socialLoading}>
                    {socialLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> GENERATING...</> : <><Sparkles className="w-4 h-4" /> GENERATE POSTS</>}
                  </button>
                </div>
              )}
            </div>

            {/* Saved social drafts */}
            <div className="lg:col-span-2 space-y-3">
              <p className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                ALL SOCIAL DRAFTS ({socials.length})
              </p>
              {socialsLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--mint)" }} /></div>}
              {!socialsLoading && socials.length === 0 && (
                <div className="vg-card p-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No social drafts yet — generate your first posts</p>
                </div>
              )}
              {socials.map((post) => (
                <div key={post.id} className="vg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="label-mono px-2.5 py-1 rounded-full" style={{ fontSize: 9, color: "#fff", backgroundColor: platformColor[post.platform] }}>
                        {post.platform.toUpperCase()}
                      </span>
                      <p className="label-mono" style={{ fontSize: 8, color: "var(--text-muted)" }}>
                        {format(new Date(post.created_at), "MMM d · h:mm a").toUpperCase()}
                      </p>
                    </div>
                    <PackageSelector type="social" id={post.id} currentPackageId={post.week_package_id} />
                  </div>

                  {post.generatingImage && (
                    <div className="rounded-lg flex items-center justify-center gap-2 py-6" style={{ backgroundColor: "var(--surface-2)", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Generating image...</span>
                    </div>
                  )}
                  {post.image_url && !post.generatingImage && (
                    <div className="relative rounded-xl overflow-hidden group" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                      <img src={post.image_url} alt="Generated" className="w-full object-cover" style={{ maxHeight: 220 }} />
                      <label className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                        <Upload className="w-4 h-4 text-white" />
                        <span className="label-mono text-white" style={{ fontSize: 9 }}>REPLACE IMAGE</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(post.id, f); }} />
                      </label>
                    </div>
                  )}
                  {!post.image_url && !post.generatingImage && (
                    <label className="rounded-lg flex items-center justify-center gap-2 py-5 cursor-pointer transition-colors hover:bg-gray-100" style={{ backgroundColor: "var(--surface-2)", border: "1px dashed rgba(0,0,0,0.15)" }}>
                      <Upload className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(post.id, f); }} />
                    </label>
                  )}

                  <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#444" }}>{post.caption}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hashtags.map((tag) => (
                        <span key={tag} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>#{tag.replace("#", "")}</span>
                      ))}
                    </div>
                  )}
                  <div className="pt-1 space-y-2" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <input
                          type="date"
                          value={post.scheduled_date ?? ""}
                          onChange={(e) => schedulePost("social", post.id, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1 outline-none transition-colors"
                          style={{ backgroundColor: "var(--surface-2)", color: post.scheduled_date ? "#111" : "var(--text-muted)", border: "none", fontSize: 11, cursor: "pointer" }}
                        />
                        {post.scheduled_date && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: 10 }}>
                            Scheduled
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleRefine(post.id)}
                        className="flex items-center gap-1 text-xs font-semibold transition-colors hover:text-[#111]"
                        style={{ color: refine[post.id]?.open ? "#111" : "var(--text-muted)", fontSize: 11 }}
                      >
                        <Wand2 className="w-3 h-3" /> Refine
                      </button>
                    </div>
                    {refine[post.id]?.open && (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
                          style={{ backgroundColor: "var(--surface-2)", border: "1px solid rgba(0,0,0,0.1)", color: "#111", fontSize: 12 }}
                          placeholder="e.g. Make it punchier, add a question, shorten to 3 sentences…"
                          value={refine[post.id]?.value ?? ""}
                          onChange={(e) => setRefine((p) => ({ ...p, [post.id]: { ...p[post.id], value: e.target.value } }))}
                          onKeyDown={(e) => e.key === "Enter" && applyRefine("social", post.id)}
                        />
                        <button
                          className={`${MINT} gap-1.5 shrink-0`}
                          style={{ fontSize: 11, padding: "6px 12px" }}
                          onClick={() => applyRefine("social", post.id)}
                          disabled={refine[post.id]?.loading}
                        >
                          {refine[post.id]?.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          {refine[post.id]?.loading ? "Refining…" : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Full Week Tab ── */}
        <TabsContent value="week">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sectionCard(
              <div className="space-y-4">
                <p className="label-kicker">Full Week Generator</p>
                <div>
                  <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>WEEK START DATE</Label>
                  <Input type="date" style={inputStyle} value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
                </div>
                <button className={`${MINT} w-full justify-center gap-2`} onClick={generateWeekPlan} disabled={weekLoading}>
                  {weekLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> PLANNING...</> : "GENERATE WEEK PLAN"}
                </button>
                {weekPlan && (
                  <button className={`${MINT} w-full justify-center gap-2`} onClick={generateAllFromPlan} disabled={generatingAll}>
                    {generatingAll ? <><Loader2 className="w-4 h-4 animate-spin" /> {weekProgress || "STARTING…"}</> : <><Sparkles className="w-4 h-4" /> GENERATE ALL CONTENT</>}
                  </button>
                )}
                {weekPlan && (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    After generating, go to Blog or Social tabs to assign content to a package
                  </p>
                )}
              </div>
            )}

            {weekPlan && (
              <div className="vg-card p-5 space-y-5">
                <div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "#111", color: "#fff" }}>
                    {weekPlan.week_theme}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Blog Posts</p>
                  <div className="space-y-2">
                    {weekPlan.blog_topics?.map((b: any, i: number) => (
                      <div key={i} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface-2)" }}>
                        <p className="text-sm font-medium" style={{ color: "#111" }}>{b.topic}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{b.keywords}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Social Posts</p>
                  <div className="space-y-2">
                    {weekPlan.social_topics?.map((s: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: platformColor[s.platform] }}>
                          {s.platform}
                        </span>
                        <span style={{ color: "#444" }}>{s.topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
