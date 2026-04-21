"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WeekPackage, BlogPost, SocialPost, ContentComment } from "@/types/database";
import {
  format, addDays, parseISO, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
  isToday, isSameMonth, addMonths, subMonths,
} from "date-fns";
import { CheckCircle2, MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Upload, CalendarDays, List, ChevronLeft, ChevronRight, X, FileText } from "lucide-react";
import { MINT, SLATE } from "@/lib/btn";
import { toast } from "sonner";

const platformColor: Record<string, string> = {
  linkedin: "#0a66c2",
  instagram: "#e1306c",
  facebook: "#1877f2",
};

type Props = {
  pkg: WeekPackage;
  blogs: BlogPost[];
  socials: SocialPost[];
  comments: ContentComment[];
};

export default function ClientPortal({ pkg, blogs, socials, comments: initialComments }: Props) {
  const [packageStatus, setPackageStatus] = useState(pkg.status);
  const [blogStatuses, setBlogStatuses] = useState<Record<string, string>>(
    Object.fromEntries(blogs.map((b) => [b.id, b.status]))
  );
  const [socialStatuses, setSocialStatuses] = useState<Record<string, string>>(
    Object.fromEntries(socials.map((s) => [s.id, s.status]))
  );
  const [comments, setComments] = useState<ContentComment[]>(initialComments);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<Record<string, boolean>>({});
  const [socialImages, setSocialImages] = useState<Record<string, string>>(
    Object.fromEntries(socials.filter((s) => s.image_url).map((s) => [s.id, s.image_url!]))
  );
  const [view, setView] = useState<"content" | "calendar">("content");
  const [calMonth, setCalMonth] = useState(() => parseISO(pkg.week_start));
  const [calSelected, setCalSelected] = useState<Date | null>(null);
  const [focusedItem, setFocusedItem] = useState<BlogPost | SocialPost | null>(null);
  const [expandedBlogs, setExpandedBlogs] = useState<Record<string, boolean>>({});
  const [clientNotes, setClientNotes] = useState(pkg.client_notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [overallSubmitted, setOverallSubmitted] = useState(packageStatus === "approved");

  async function approveContent(type: "blog_post" | "social_post", id: string) {
    const res = await fetch("/api/update-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status: "approved" }),
    });
    if (res.ok) {
      if (type === "blog_post") setBlogStatuses((p) => ({ ...p, [id]: "approved" }));
      else setSocialStatuses((p) => ({ ...p, [id]: "approved" }));
      toast.success("Approved");
    }
  }

  async function addComment(contentType: "blog_post" | "social_post", contentId: string) {
    const body = commentInputs[contentId];
    if (!body?.trim()) return;
    const res = await fetch("/api/add-comment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content_type: contentType, content_id: contentId, week_package_id: pkg.id, body, author: "Client" }),
    });
    if (res.ok) {
      setComments((prev) => [...prev, {
        id: Date.now().toString(), content_type: contentType, content_id: contentId,
        week_package_id: pkg.id, author: "Client", body, created_at: new Date().toISOString(),
      }]);
      setCommentInputs((p) => ({ ...p, [contentId]: "" }));
      await fetch("/api/update-status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "week_package", id: pkg.id, status: "changes_requested" }),
      });
      setPackageStatus("changes_requested");
    }
  }

  async function submitReview() {
    setSubmitting(true);
    const allApproved = blogs.every((b) => blogStatuses[b.id] === "approved") && socials.every((s) => socialStatuses[s.id] === "approved");
    const status = allApproved ? "approved" : "changes_requested";
    await fetch("/api/update-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "week_package", id: pkg.id, status, client_notes: clientNotes }),
    });
    setPackageStatus(status);
    setOverallSubmitted(true);
    toast.success(allApproved ? "All approved! We'll get this posted." : "Feedback submitted — we'll revise and resend.");
    setSubmitting(false);
  }

  async function uploadImage(postId: string, file: File) {
    setUploadingImage((p) => ({ ...p, [postId]: true }));
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("postId", postId);
      const res = await fetch("/api/upload-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSocialImages((p) => ({ ...p, [postId]: data.image_url }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingImage((p) => ({ ...p, [postId]: false }));
    }
  }

  const commentsFor = (id: string) => comments.filter((c) => c.content_id === id);

  const bannerConfig: Record<string, { label: string; bg: string; text: string }> = {
    pending_review:    { label: "Awaiting your review",               bg: "#dbeafe", text: "#1d4ed8" },
    changes_requested: { label: "Changes requested — we'll revise",   bg: "#fef3c7", text: "#92400e" },
    approved:          { label: "All approved — ready to post",       bg: "#dcfce7", text: "#15803d" },
  };
  const banner = bannerConfig[packageStatus];

  const textareaStyle = {
    backgroundColor: "#fff",
    boxShadow: "rgba(34,42,53,0.08) 0px 0px 0px 1px",
    border: "none",
    borderRadius: 8,
    color: "#111",
    fontSize: 13,
    resize: "none" as const,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: "#fff", borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "#111" }}>Ranck Inc.</p>
            <p className="label-mono mt-0.5" style={{ fontSize: 9, color: "var(--text-muted)" }}>
              {pkg.week_label.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center rounded-lg p-0.5" style={{ backgroundColor: "var(--surface-2)" }}>
              <button
                onClick={() => setView("content")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  backgroundColor: view === "content" ? "#fff" : "transparent",
                  color: view === "content" ? "#111" : "var(--text-muted)",
                  boxShadow: view === "content" ? "var(--shadow-sm)" : "none",
                }}
              >
                <List className="w-3 h-3" /> Content
              </button>
              <button
                onClick={() => setView("calendar")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  backgroundColor: view === "calendar" ? "#fff" : "transparent",
                  color: view === "calendar" ? "#111" : "var(--text-muted)",
                  boxShadow: view === "calendar" ? "var(--shadow-sm)" : "none",
                }}
              >
                <CalendarDays className="w-3 h-3" /> Schedule
              </button>
            </div>
            <span
              className="label-mono px-3 py-1.5 rounded-full"
              style={{ fontSize: 11, backgroundColor: banner.bg, color: banner.text }}
            >
              {banner.label}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Calendar View ── */}
        {view === "calendar" && (() => {
          const PS: Record<string, { bg: string; text: string; label: string }> = {
            linkedin:  { bg: "#dbeafe", text: "#1d4ed8",  label: "LI" },
            instagram: { bg: "#fce7f3", text: "#be185d",  label: "IG" },
            facebook:  { bg: "#eff6ff", text: "#1877f2",  label: "FB" },
            blog:      { bg: "#eef2ff", text: "#4f46e5",  label: "Blog" },
          };

          const calDays = eachDayOfInterval({
            start: startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 }),
            end: endOfWeek(endOfMonth(calMonth), { weekStartsOn: 0 }),
          });

          function itemsForCalDay(day: Date) {
            const key = format(day, "yyyy-MM-dd");
            return [
              ...blogs.filter((b) => b.scheduled_date === key).map((b) => ({ kind: "blog" as const, data: b })),
              ...socials.filter((s) => s.scheduled_date === key).map((s) => ({ kind: "social" as const, data: s })),
            ];
          }

          const selectedItems = calSelected ? itemsForCalDay(calSelected) : [];

          return (
            <div className="space-y-4">
              {/* Month nav */}
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm" style={{ color: "#111" }}>{format(calMonth, "MMMM yyyy")}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f3f3f3]" style={{ color: "var(--text-muted)" }}><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setCalMonth(new Date()); setCalSelected(new Date()); }} className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-[#f3f3f3]" style={{ color: "#111" }}>Today</button>
                  <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#f3f3f3]" style={{ color: "var(--text-muted)" }}><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Grid */}
                <div className="flex-1 vg-card overflow-hidden">
                  <div className="grid grid-cols-7" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                      <div key={d} className="py-2 text-center" style={{ borderRight: "1px solid rgba(0,0,0,0.04)" }}>
                        <span className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {calDays.map((day, i) => {
                      const items = itemsForCalDay(day);
                      const inMonth = isSameMonth(day, calMonth);
                      const today = isToday(day);
                      const isSel = calSelected && isSameDay(day, calSelected);
                      const visible = items.slice(0, 2);
                      const overflow = items.length - 2;
                      return (
                        <button
                          key={i}
                          onClick={() => setCalSelected(calSelected && isSameDay(day, calSelected) ? null : day)}
                          className="relative text-left p-1.5 transition-colors hover:bg-[#fafafa] min-h-[80px]"
                          style={{
                            borderRight: (i+1)%7!==0 ? "1px solid rgba(0,0,0,0.04)" : "none",
                            borderBottom: i < calDays.length-7 ? "1px solid rgba(0,0,0,0.04)" : "none",
                            backgroundColor: isSel ? "var(--surface-2)" : undefined,
                          }}
                        >
                          <span className="inline-flex w-5 h-5 items-center justify-center rounded-full mb-1" style={{ fontSize: 11, fontWeight: today ? 700 : 600, backgroundColor: today ? "#111" : "transparent", color: today ? "#fff" : inMonth ? "#111" : "var(--text-muted)" }}>
                            {format(day, "d")}
                          </span>
                          <div className="space-y-0.5">
                            {visible.map((item, j) => {
                              const s = item.kind === "blog" ? PS.blog : PS[(item.data as SocialPost).platform];
                              const lbl = item.kind === "blog" ? (item.data as BlogPost).title.slice(0, 18) : `${s.label} · ${(item.data as SocialPost).caption.slice(0, 12)}`;
                              return (
                                <div key={j} className="rounded px-1 py-0.5 flex items-center gap-0.5" style={{ backgroundColor: s.bg }}>
                                  {item.data.status === "approved" && <CheckCircle2 className="w-2 h-2 shrink-0" style={{ color: "#16a34a" }} />}
                                  <span className="truncate" style={{ fontSize: 9, fontWeight: 600, color: s.text }}>{lbl}</span>
                                </div>
                              );
                            })}
                            {overflow > 0 && <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>+{overflow} more</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day detail */}
                <div className="w-60 shrink-0">
                  {!calSelected ? (
                    <div className="vg-card p-4 text-center">
                      <CalendarDays className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select a day to see scheduled content</p>
                    </div>
                  ) : (
                    <div className="vg-card overflow-hidden">
                      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <p className="font-semibold text-xs" style={{ color: "#111" }}>{format(calSelected, "EEEE, MMM d")}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedItems.length === 0 ? "Nothing scheduled" : `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`}</p>
                      </div>
                      {selectedItems.length === 0 ? (
                        <p className="p-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>No content this day</p>
                      ) : (
                        <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                          {selectedItems.map((item, i) => {
                            const s = item.kind === "blog" ? PS.blog : PS[(item.data as SocialPost).platform];
                            const isApproved = item.data.status === "approved";
                            return (
                              <button key={i} onClick={() => setFocusedItem(item.data)} className="w-full text-left p-3 hover:bg-[#fafafa] transition-colors">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="label-mono px-1.5 py-0.5 rounded-full" style={{ fontSize: 8, backgroundColor: s.bg, color: s.text }}>
                                    {item.kind === "blog" ? "BLOG" : (item.data as SocialPost).platform.toUpperCase()}
                                  </span>
                                  <span className="label-mono px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ fontSize: 8, backgroundColor: isApproved ? "#dcfce7" : "var(--surface-2)", color: isApproved ? "#15803d" : "var(--text-muted)" }}>
                                    {isApproved && <CheckCircle2 className="w-2 h-2" />}{isApproved ? "APPROVED" : "DRAFT"}
                                  </span>
                                </div>
                                {item.kind === "blog" ? (
                                  <p className="text-xs font-semibold leading-snug" style={{ color: "#111" }}>{(item.data as BlogPost).title}</p>
                                ) : (
                                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#444" }}>{(item.data as SocialPost).caption}</p>
                                )}
                                <p className="text-xs mt-1" style={{ color: "#0a66c2", fontWeight: 600 }}>View full post →</p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Content View ── */}
        {view === "content" && <>

        {/* Intro card */}
        <div className="vg-card p-6">
          <p className="label-kicker mb-3">Content Review</p>
          <h1 className="font-display mb-3" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>
            {pkg.week_label}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
            Review the content below. Approve individual pieces or leave a comment to request changes.
            Hit <strong style={{ color: "#111" }}>Submit Review</strong> when you're done.
          </p>
        </div>

        {/* Blog Posts */}
        {blogs.length > 0 && (
          <section>
            <p className="label-kicker mb-3">Blog Posts</p>
            <div className="space-y-3">
              {blogs.map((blog) => {
                const isExpanded = expandedBlogs[blog.id];
                const blogComments = commentsFor(blog.id);
                const approved = blogStatuses[blog.id] === "approved";
                return (
                  <div
                    key={blog.id}
                    className="vg-card overflow-hidden"
                    style={{ borderColor: approved ? "var(--mint-border)" : undefined }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="label-mono px-2 py-0.5 rounded-full" style={{ fontSize: 9, backgroundColor: "var(--surface-2)", color: "var(--text-muted)" }}>
                              WORDPRESS BLOG
                            </span>
                            {approved && (
                              <span className="label-mono px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontSize: 9, backgroundColor: "#dcfce7", color: "#15803d" }}>
                                <CheckCircle2 className="w-3 h-3" /> APPROVED
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold" style={{ color: "#111" }}>{blog.title}</h3>
                          {blog.excerpt && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{blog.excerpt}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {!approved && (
                            <button
                              onClick={() => approveContent("blog_post", blog.id)}
                              className={`${MINT} gap-1.5`}
                              style={{ fontSize: 10, padding: "7px 14px" }}
                            >
                              <ThumbsUp className="w-3 h-3" /> APPROVE
                            </button>
                          )}
                          <button
                            className={`${SLATE} gap-1.5`}
                            onClick={() => setExpandedBlogs((p) => ({ ...p, [blog.id]: !p[blog.id] }))}
                            style={{ fontSize: 10, padding: "7px 14px" }}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? "HIDE" : "READ"}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div
                          className="blog-prose rounded-lg p-5 mb-4"
                          style={{ backgroundColor: "var(--surface-2)", border: "1px solid rgba(0,0,0,0.06)" }}
                          dangerouslySetInnerHTML={{ __html: blog.content_html }}
                        />
                      )}

                      {blogComments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {blogComments.map((c) => (
                            <div key={c.id} className="rounded-xl p-3" style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
                              <p className="label-mono mb-1" style={{ fontSize: 9, color: "#92400e" }}>
                                {c.author.toUpperCase()} · {format(new Date(c.created_at), "MMM d").toUpperCase()}
                              </p>
                              <p className="text-sm" style={{ color: "#444" }}>{c.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Textarea
                          style={textareaStyle}
                          className="h-14 text-sm"
                          placeholder="Leave a comment or request a change..."
                          value={commentInputs[blog.id] ?? ""}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentInputs((p) => ({ ...p, [blog.id]: e.target.value }))}
                        />
                        <button
                          className={`${SLATE} gap-1.5 self-end shrink-0`}
                          onClick={() => addComment("blog_post", blog.id)}
                          style={{ fontSize: 10, padding: "8px 14px" }}
                        >
                          <MessageSquare className="w-3 h-3" /> COMMENT
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Social Posts */}
        {socials.length > 0 && (
          <section>
            <p className="label-kicker mb-3">Social Media Posts</p>
            <div className="space-y-3">
              {(["linkedin", "instagram", "facebook"] as const).map((platform) => {
                const platformPosts = socials.filter((s) => s.platform === platform);
                if (platformPosts.length === 0) return null;
                return (
                  <div key={platform}>
                    <p className="label-mono mb-2" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                      {platform.toUpperCase()}
                    </p>
                    <div className="space-y-3">
                      {platformPosts.map((post) => {
                        const postComments = commentsFor(post.id);
                        const approved = socialStatuses[post.id] === "approved";
                        return (
                          <div
                            key={post.id}
                            className="vg-card p-5"
                            style={{ borderColor: approved ? "var(--mint-border)" : undefined }}
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="label-mono px-2.5 py-0.5 rounded-full" style={{ fontSize: 9, color: "#fff", backgroundColor: platformColor[platform] }}>
                                    {platform.toUpperCase()}
                                  </span>
                                  {approved && (
                                    <span className="label-mono px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontSize: 9, backgroundColor: "#dcfce7", color: "#15803d" }}>
                                      <CheckCircle2 className="w-3 h-3" /> APPROVED
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#444" }}>{post.caption}</p>
                                {post.hashtags && post.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {post.hashtags.map((tag) => (
                                      <span key={tag} className="label-mono" style={{ fontSize: 9, color: "var(--mint)" }}>#{tag.replace("#", "")}</span>
                                    ))}
                                  </div>
                                )}
                                {socialImages[post.id] ? (
                                  <div className="mt-3 relative rounded-lg overflow-hidden group" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                                    <img src={socialImages[post.id]} alt="Post image" className="w-full" style={{ display: "block", height: "auto" }} />
                                    <label className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                                      {uploadingImage[post.id] ? <span className="text-xs text-white font-medium">Uploading...</span> : <><Upload className="w-4 h-4 text-white" /><span className="text-xs text-white font-medium">Replace image</span></>}
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(post.id, f); }} />
                                    </label>
                                  </div>
                                ) : (
                                  <label className="mt-3 rounded-lg flex items-center justify-center gap-2 py-5 cursor-pointer transition-colors hover:bg-gray-100" style={{ backgroundColor: "var(--surface-2)", border: "1px dashed rgba(0,0,0,0.15)" }}>
                                    {uploadingImage[post.id] ? (
                                      <span className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>UPLOADING...</span>
                                    ) : (
                                      <><Upload className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>UPLOAD YOUR OWN IMAGE</span></>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(post.id, f); }} />
                                  </label>
                                )}
                              </div>
                              {!approved && (
                                <button
                                  onClick={() => approveContent("social_post", post.id)}
                                  className={`${MINT} gap-1.5 shrink-0`}
                                  style={{ fontSize: 10, padding: "7px 14px" }}
                                >
                                  <ThumbsUp className="w-3 h-3" /> APPROVE
                                </button>
                              )}
                            </div>

                            {postComments.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {postComments.map((c) => (
                                  <div key={c.id} className="rounded-xl p-3" style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
                                    <p className="label-mono mb-1" style={{ fontSize: 9, color: "#92400e" }}>
                                      {c.author.toUpperCase()} · {format(new Date(c.created_at), "MMM d").toUpperCase()}
                                    </p>
                                    <p className="text-sm" style={{ color: "#444" }}>{c.body}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Textarea
                                style={textareaStyle}
                                className="h-14 text-sm"
                                placeholder="Leave a comment or request a change..."
                                value={commentInputs[post.id] ?? ""}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))}
                              />
                              <button
                                className={`${SLATE} gap-1.5 self-end shrink-0`}
                                onClick={() => addComment("social_post", post.id)}
                                style={{ fontSize: 10, padding: "8px 14px" }}
                              >
                                <MessageSquare className="w-3 h-3" /> COMMENT
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Submit Review */}
        {!overallSubmitted && (
          <div className="vg-card p-6 space-y-4">
            <p className="label-kicker">Submit Your Review</p>
            <div>
              <Label className="label-mono mb-1.5 block" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                OVERALL NOTES (OPTIONAL)
              </Label>
              <Textarea
                style={{ ...textareaStyle, height: 80 }}
                placeholder="Any overall feedback, questions, or instructions..."
                value={clientNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClientNotes(e.target.value)}
              />
            </div>
            <button
              className={`${MINT} w-full justify-center`}
              onClick={submitReview}
              disabled={submitting}
              style={{ fontSize: 12, padding: "12px 24px" }}
            >
              {submitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
            </button>
            <p className="label-mono text-center" style={{ fontSize: 9, color: "var(--text-muted)" }}>
              APPROVE INDIVIDUAL ITEMS ABOVE, THEN CLICK SUBMIT WHEN READY
            </p>
          </div>
        )}

        {overallSubmitted && (
          <div className="vg-card p-8 text-center" style={{ borderColor: "var(--mint-border)" }}>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--mint)" }} />
            <p className="font-display mb-2" style={{ fontSize: 24, letterSpacing: "-0.3px", color: "#111", fontWeight: 700 }}>Review Submitted</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Thank you! We'll follow up shortly with any updates or next steps.</p>
          </div>
        )}

        <p className="text-center pb-8 text-xs" style={{ color: "#ccc" }}>
          POWERED BY VERSIONSEVEN.AI
        </p>

        </> /* end content view */}

      </div>

      {/* ── Content detail modal ── */}
      {focusedItem && (() => {
        const isBlog = "title" in focusedItem;
        const PS: Record<string, { bg: string; text: string }> = {
          linkedin: { bg: "#dbeafe", text: "#1d4ed8" }, instagram: { bg: "#fce7f3", text: "#be185d" },
          facebook: { bg: "#eff6ff", text: "#1877f2" }, blog: { bg: "#eef2ff", text: "#4f46e5" },
        };
        const s = isBlog ? PS.blog : PS[(focusedItem as SocialPost).platform];
        const imgUrl = !isBlog ? (socialImages[(focusedItem as SocialPost).id] ?? (focusedItem as SocialPost).image_url) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setFocusedItem(null)}>
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span className="label-mono px-2 py-0.5 rounded-full" style={{ fontSize: 9, backgroundColor: s.bg, color: s.text }}>
                    {isBlog ? "BLOG" : (focusedItem as SocialPost).platform.toUpperCase()}
                  </span>
                  <span className="label-mono px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontSize: 9, backgroundColor: focusedItem.status === "approved" ? "#dcfce7" : "var(--surface-2)", color: focusedItem.status === "approved" ? "#15803d" : "var(--text-muted)" }}>
                    {focusedItem.status === "approved" && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {focusedItem.status === "approved" ? "APPROVED" : "DRAFT"}
                  </span>
                </div>
                <button onClick={() => setFocusedItem(null)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#f3f3f3]" style={{ color: "var(--text-muted)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                {isBlog ? (
                  <>
                    <h2 className="font-display mb-4" style={{ fontSize: 22, letterSpacing: "-0.3px", color: "#111", fontWeight: 700 }}>{(focusedItem as BlogPost).title}</h2>
                    <div className="blog-prose" dangerouslySetInnerHTML={{ __html: (focusedItem as BlogPost).content_html }} />
                  </>
                ) : (
                  <>
                    {imgUrl && <img src={imgUrl} alt="" className="w-full rounded-xl mb-4" style={{ height: "auto" }} />}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3" style={{ color: "#111" }}>{(focusedItem as SocialPost).caption}</p>
                    {(focusedItem as SocialPost).hashtags?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(focusedItem as SocialPost).hashtags!.map((t) => (
                          <span key={t} className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>#{t.replace("#","")}</span>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
