"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { WeekPackage, BlogPost, SocialPost } from "@/types/database";
import { format, addDays, parseISO } from "date-fns";
import { Copy, ExternalLink, Plus, Loader2, Check, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";
import { MINT, SLATE, OUTLINE } from "@/lib/btn";
import { toast } from "sonner";

const pkgStatusStyle: Record<string, { bg: string; text: string }> = {
  pending_review:    { bg: "#dbeafe", text: "#1d4ed8" },
  changes_requested: { bg: "#fee2e2", text: "#b91c1c" },
  approved:          { bg: "#dcfce7", text: "#15803d" },
};
const platformColor: Record<string, string> = {
  linkedin: "#6366f1", instagram: "#e1306c", facebook: "#1877f2",
};
const inputStyle = {
  backgroundColor: "#fff",
  boxShadow: "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.04) 0px 1px 3px 0px",
  border: "none",
  borderRadius: 8,
  color: "#111",
  fontSize: 14,
};

export default function PackagesPage() {
  const supabase = createClient();
  const [packages, setPackages] = useState<WeekPackage[]>([]);
  const [draftBlogs, setDraftBlogs] = useState<BlogPost[]>([]);
  const [draftSocials, setDraftSocials] = useState<SocialPost[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pkgBlogs, setPkgBlogs] = useState<Record<string, BlogPost[]>>({});
  const [pkgSocials, setPkgSocials] = useState<Record<string, SocialPost[]>>({});
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [weekLabel, setWeekLabel] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: pkgs }, { data: blogs }, { data: socials }] = await Promise.all([
      supabase.from("week_packages").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_posts").select("*").eq("status", "draft").is("week_package_id", null),
      supabase.from("social_posts").select("*").eq("status", "draft").is("week_package_id", null),
    ]);
    setPackages((pkgs as WeekPackage[]) ?? []);
    setDraftBlogs((blogs as BlogPost[]) ?? []);
    setDraftSocials((socials as SocialPost[]) ?? []);
  }

  async function createPackage() {
    if (!weekLabel || !weekStart) { toast.error("Fill in week label and date"); return; }
    setCreating(true);
    try {
      const { data: pkg, error } = await supabase
        .from("week_packages")
        .insert({ week_label: weekLabel, week_start: weekStart, status: "pending_review" })
        .select().single();
      if (error || !pkg) throw error;
      if (selectedBlogs.length > 0)
        await supabase.from("blog_posts").update({ week_package_id: (pkg as any).id }).in("id", selectedBlogs);
      if (selectedSocials.length > 0)
        await supabase.from("social_posts").update({ week_package_id: (pkg as any).id }).in("id", selectedSocials);
      toast.success("Week package created");
      setShowCreate(false); setWeekLabel(""); setWeekStart("");
      setSelectedBlogs([]); setSelectedSocials([]);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create package");
    } finally { setCreating(false); }
  }

  async function expandPackage(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!pkgBlogs[id]) {
      const [{ data: blogs }, { data: socials }] = await Promise.all([
        supabase.from("blog_posts").select("*").eq("week_package_id", id),
        supabase.from("social_posts").select("*").eq("week_package_id", id),
      ]);
      setPkgBlogs((p) => ({ ...p, [id]: (blogs as BlogPost[]) ?? [] }));
      setPkgSocials((p) => ({ ...p, [id]: (socials as SocialPost[]) ?? [] }));
    }
  }

  async function autoSchedule(pkg: WeekPackage) {
    setScheduling(pkg.id);
    try {
      const [{ data: blogs }, { data: socials }] = await Promise.all([
        supabase.from("blog_posts").select("id").eq("week_package_id", pkg.id),
        supabase.from("social_posts").select("id, platform").eq("week_package_id", pkg.id),
      ]);

      const base = parseISO(pkg.week_start); // treat as Monday
      // Slot map: day offset from week_start
      const slots: Record<string, number> = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };

      // Default weekly template: blog→Mon/Wed/Fri, linkedin→Tue, instagram→Thu, facebook→Sat
      const blogDays   = [0, 2, 4]; // Mon, Wed, Fri
      const platformDay: Record<string, number> = { linkedin: 1, instagram: 3, facebook: 5 };

      const updates: PromiseLike<any>[] = [];

      (blogs ?? []).forEach((b, i) => {
        const offset = blogDays[i % blogDays.length];
        const date = format(addDays(base, offset), "yyyy-MM-dd");
        updates.push(supabase.from("blog_posts").update({ scheduled_date: date }).eq("id", b.id).then());
      });

      (socials ?? []).forEach((s) => {
        const offset = platformDay[s.platform] ?? 4;
        const date = format(addDays(base, offset), "yyyy-MM-dd");
        updates.push(supabase.from("social_posts").update({ scheduled_date: date }).eq("id", s.id).then());
      });

      await Promise.all(updates);

      // Refresh expanded content
      if (expanded === pkg.id) {
        const [{ data: freshBlogs }, { data: freshSocials }] = await Promise.all([
          supabase.from("blog_posts").select("*").eq("week_package_id", pkg.id),
          supabase.from("social_posts").select("*").eq("week_package_id", pkg.id),
        ]);
        setPkgBlogs((p) => ({ ...p, [pkg.id]: (freshBlogs as BlogPost[]) ?? [] }));
        setPkgSocials((p) => ({ ...p, [pkg.id]: (freshSocials as SocialPost[]) ?? [] }));
      }

      const total = (blogs?.length ?? 0) + (socials?.length ?? 0);
      toast.success(`Scheduled ${total} posts across the week`);
    } catch {
      toast.error("Scheduling failed");
    } finally {
      setScheduling(null);
    }
  }

  function copyPortalLink(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/portal/${token}`);
    setCopiedToken(token); toast.success("Review link copied");
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-kicker mb-2">Content</p>
          <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>
            Week Packages
          </h1>
        </div>
        <button className={`${MINT} gap-2`} onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4" /> New Package
        </button>
      </div>

      {/* Create Panel */}
      {showCreate && (
        <div className="vg-card p-6 mb-6 space-y-5">
          <p className="text-sm font-semibold" style={{ color: "#111" }}>New Week Package</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Week Label</Label>
              <Input style={inputStyle} placeholder="Week of April 21, 2026" value={weekLabel} onChange={(e) => setWeekLabel(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Week Start Date</Label>
              <Input type="date" style={inputStyle} value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
          </div>

          {draftBlogs.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Select Blog Posts</p>
              <div className="space-y-2">
                {draftBlogs.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedBlogs.includes(b.id)}
                      onChange={(e) => setSelectedBlogs((p) => e.target.checked ? [...p, b.id] : p.filter((x) => x !== b.id))}
                      className="rounded" />
                    <span className="text-sm" style={{ color: "#111" }}>{b.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {draftSocials.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Select Social Posts</p>
              <div className="space-y-2">
                {draftSocials.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedSocials.includes(s.id)}
                      onChange={(e) => setSelectedSocials((p) => e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id))}
                      className="rounded" />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: platformColor[s.platform] }}>
                      {s.platform}
                    </span>
                    <span className="text-sm truncate max-w-md" style={{ color: "var(--text-soft)" }}>{s.caption.slice(0, 80)}…</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {draftBlogs.length === 0 && draftSocials.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No unassigned drafts. Generate content first.</p>
          )}

          <div className="flex gap-3">
            <button className={`${MINT} gap-2`} onClick={createPackage} disabled={creating}>
              {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Package"}
            </button>
            <button className={SLATE} onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Package List */}
      <div className="space-y-3">
        {packages.length === 0 && (
          <div className="vg-card p-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No packages yet. Create your first one above.</p>
          </div>
        )}
        {packages.map((pkg) => {
          const s = pkgStatusStyle[pkg.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
          return (
            <div key={pkg.id} className="vg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => expandPackage(pkg.id)} style={{ color: "var(--text-muted)" }}>
                    {expanded === pkg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#111" }}>{pkg.week_label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(pkg.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
                    {pkg.status.replace(/_/g, " ")}
                  </span>
                  <button
                    className={`${OUTLINE} gap-1.5`}
                    onClick={() => autoSchedule(pkg)}
                    disabled={scheduling === pkg.id}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {scheduling === pkg.id
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Scheduling…</>
                      : <><CalendarDays className="w-3 h-3" /> Auto-Schedule</>}
                  </button>
                  <button className={`${OUTLINE} gap-1.5`} onClick={() => copyPortalLink(pkg.review_token)}>
                    {copiedToken === pkg.review_token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedToken === pkg.review_token ? "Copied" : "Copy Link"}
                  </button>
                  <button className={`${SLATE} gap-1.5`} onClick={() => window.open(`/portal/${pkg.review_token}`, "_blank")} style={{ fontSize: 12, padding: "6px 12px" }}>
                    <ExternalLink className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>

              {expanded === pkg.id && (
                <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
                  <div className="pt-4" />
                  {pkgBlogs[pkg.id]?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Blog Posts</p>
                      <div className="space-y-1.5">
                        {pkgBlogs[pkg.id].map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface-2)" }}>
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm truncate" style={{ color: "#111" }}>{b.title}</span>
                              {b.scheduled_date && (
                                <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                                  <CalendarDays className="w-3 h-3" />
                                  {format(parseISO(b.scheduled_date), "EEE MMM d")}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: b.status === "approved" ? "#dcfce7" : "#f3f4f6", color: b.status === "approved" ? "#15803d" : "#6b7280" }}>
                              {b.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pkgSocials[pkg.id]?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Social Posts</p>
                      <div className="space-y-1.5">
                        {pkgSocials[pkg.id].map((s) => (
                          <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--surface-2)" }}>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: platformColor[s.platform] }}>
                              {s.platform}
                            </span>
                            <span className="text-sm flex-1 truncate" style={{ color: "#444" }}>{s.caption.slice(0, 80)}…</span>
                            {s.scheduled_date && (
                              <span className="text-xs shrink-0 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                                <CalendarDays className="w-3 h-3" />
                                {format(parseISO(s.scheduled_date), "EEE MMM d")}
                              </span>
                            )}
                            <span className="text-xs font-medium shrink-0" style={{ color: s.status === "approved" ? "#15803d" : "var(--text-muted)" }}>
                              {s.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {pkg.client_notes && (
                    <div className="rounded-lg p-3" style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#92400e" }}>Client Notes</p>
                      <p className="text-sm" style={{ color: "#78350f" }}>{pkg.client_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
