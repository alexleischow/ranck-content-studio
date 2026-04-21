"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BlogPost, SocialPost } from "@/types/database";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, isSameMonth,
  addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, X } from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ContentItem =
  | { kind: "blog"; data: BlogPost }
  | { kind: "social"; data: SocialPost };

const platformStyle: Record<string, { bg: string; text: string; label: string }> = {
  linkedin:  { bg: "#dbeafe", text: "#1d4ed8", label: "LI" },
  instagram: { bg: "#fce7f3", text: "#be185d", label: "IG" },
  facebook:  { bg: "#eff6ff", text: "#1877f2", label: "FB" },
  blog:      { bg: "#eef2ff", text: "#4f46e5", label: "Blog" },
};

function getCalendarDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export default function CalendarPage() {
  const supabase = createClient();
  const [month, setMonth] = useState(new Date());
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [socials, setSocials] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);
  const [focusedItem, setFocusedItem] = useState<ContentItem | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("blog_posts").select("*").not("scheduled_date", "is", null),
      supabase.from("social_posts").select("*").not("scheduled_date", "is", null),
    ]);
    setBlogs((b as BlogPost[]) ?? []);
    setSocials((s as SocialPost[]) ?? []);
    setLoading(false);
  }

  const days = useMemo(() => getCalendarDays(month), [month]);

  function itemsForDay(day: Date): ContentItem[] {
    const key = format(day, "yyyy-MM-dd");
    const b: ContentItem[] = blogs
      .filter((p) => p.scheduled_date === key)
      .map((data) => ({ kind: "blog" as const, data }));
    const s: ContentItem[] = socials
      .filter((p) => p.scheduled_date === key)
      .map((data) => ({ kind: "social" as const, data }));
    return [...b, ...s];
  }

  const selectedItems = selected ? itemsForDay(selected) : [];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="label-kicker mb-2">Planning</p>
          <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>
            Content Calendar
          </h1>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f3f3f3]"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm w-36 text-center" style={{ color: "#111" }}>
            {format(month, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[#f3f3f3]"
            style={{ color: "var(--text-muted)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setMonth(new Date()); setSelected(new Date()); }}
            className="ml-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[#f3f3f3]"
            style={{ color: "#111" }}
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div className="vg-card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="py-2.5 text-center" style={{ borderRight: "1px solid rgba(0,0,0,0.04)" }}>
                  <span className="label-mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>{d}</span>
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const items = itemsForDay(day);
                const inMonth = isSameMonth(day, month);
                const today = isToday(day);
                const isSelected = selected && isSameDay(day, selected);
                const visible = items.slice(0, 3);
                const overflow = items.length - 3;

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSameDay(day, selected ?? new Date("1970-01-01")) ? null : day)}
                    className="relative text-left p-2 transition-colors hover:bg-[#fafafa] min-h-[90px]"
                    style={{
                      borderRight: (i + 1) % 7 !== 0 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      borderBottom: i < days.length - 7 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      backgroundColor: isSelected ? "var(--surface-2)" : undefined,
                    }}
                  >
                    {/* Day number */}
                    <span
                      className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold mb-1"
                      style={{
                        backgroundColor: today ? "#111" : "transparent",
                        color: today ? "#fff" : inMonth ? "#111" : "var(--text-muted)",
                        fontWeight: today ? 700 : inMonth ? 600 : 400,
                      }}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Content pills */}
                    <div className="space-y-0.5">
                      {visible.map((item, j) => {
                        const style = item.kind === "blog"
                          ? platformStyle.blog
                          : platformStyle[item.data.platform];
                        const label = item.kind === "blog"
                          ? (item.data as BlogPost).title.slice(0, 22)
                          : `${style.label} · ${(item.data as SocialPost).caption.slice(0, 16)}`;
                        return (
                          <div
                            key={j}
                            className="rounded px-1.5 py-0.5 text-left truncate flex items-center gap-1"
                            style={{ backgroundColor: style.bg }}
                          >
                            {item.data.status === "approved" && (
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" style={{ color: "#16a34a" }} />
                            )}
                            <span className="truncate" style={{ fontSize: 10, fontWeight: 600, color: style.text }}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                      {overflow > 0 && (
                        <span className="text-xs" style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>
                          +{overflow} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 px-1">
            {[
              { name: "Blog Post", bg: platformStyle.blog.bg, text: platformStyle.blog.text },
              { name: "LinkedIn",  bg: platformStyle.linkedin.bg, text: platformStyle.linkedin.text },
              { name: "Instagram", bg: platformStyle.instagram.bg, text: platformStyle.instagram.text },
              { name: "Facebook",  bg: platformStyle.facebook.bg, text: platformStyle.facebook.text },
            ].map(({ name, bg, text }) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: bg, outline: `1px solid ${text}30` }} />
                <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 11 }}>{name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-2.5 h-2.5" style={{ color: "#16a34a" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 11 }}>Approved</span>
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="w-72 shrink-0">
          {!selected && (
            <div className="vg-card p-6 text-center" style={{ height: "fit-content" }}>
              <Clock className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "#111" }}>Select a day</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click any day on the calendar to see its scheduled content
              </p>
            </div>
          )}

          {selected && (
            <div className="vg-card overflow-hidden">
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="font-semibold text-sm" style={{ color: "#111" }}>
                  {format(selected, "EEEE, MMMM d")}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {selectedItems.length === 0 ? "Nothing scheduled" : `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} scheduled`}
                </p>
              </div>

              {selectedItems.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No content scheduled for this day.
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Set dates on drafts in the Generate tab.
                  </p>
                </div>
              )}

              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                {selectedItems.map((item, i) => {
                  const style = item.kind === "blog"
                    ? platformStyle.blog
                    : platformStyle[item.data.platform];
                  const isApproved = item.data.status === "approved";
                  return (
                    <button key={i} onClick={() => setFocusedItem(item)} className="w-full text-left p-4 hover:bg-[#fafafa] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="label-mono px-2 py-0.5 rounded-full" style={{ fontSize: 9, backgroundColor: style.bg, color: style.text }}>
                          {item.kind === "blog" ? "BLOG" : (item.data as SocialPost).platform.toUpperCase()}
                        </span>
                        <span className="label-mono px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontSize: 9, backgroundColor: isApproved ? "#dcfce7" : "var(--surface-2)", color: isApproved ? "#15803d" : "var(--text-muted)" }}>
                          {isApproved && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isApproved ? "APPROVED" : "DRAFT"}
                        </span>
                      </div>
                      {item.kind === "blog" ? (
                        <>
                          <p className="text-sm font-semibold leading-snug" style={{ color: "#111" }}>{(item.data as BlogPost).title}</p>
                          {(item.data as BlogPost).excerpt && (
                            <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{(item.data as BlogPost).excerpt}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "#444" }}>{(item.data as SocialPost).caption}</p>
                      )}
                      <p className="text-xs mt-2 font-semibold" style={{ color: "#0a66c2" }}>View full post →</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content detail modal */}
      {focusedItem && (() => {
        const style = focusedItem.kind === "blog" ? platformStyle.blog : platformStyle[focusedItem.data.platform];
        const isApproved = focusedItem.data.status === "approved";
        const isBlog = focusedItem.kind === "blog";
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-16" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setFocusedItem(null)}>
            <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white" style={{ boxShadow: "var(--shadow-card)" }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <span className="label-mono px-2 py-0.5 rounded-full" style={{ fontSize: 9, backgroundColor: style.bg, color: style.text }}>
                    {isBlog ? "BLOG" : (focusedItem.data as SocialPost).platform.toUpperCase()}
                  </span>
                  <span className="label-mono px-2 py-0.5 rounded-full flex items-center gap-1" style={{ fontSize: 9, backgroundColor: isApproved ? "#dcfce7" : "var(--surface-2)", color: isApproved ? "#15803d" : "var(--text-muted)" }}>
                    {isApproved && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {isApproved ? "APPROVED" : "DRAFT"}
                  </span>
                  {focusedItem.data.scheduled_date && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {format(parseISO(focusedItem.data.scheduled_date), "EEEE, MMMM d")}
                    </span>
                  )}
                </div>
                <button onClick={() => setFocusedItem(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f3f3f3]" style={{ color: "var(--text-muted)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                {isBlog ? (
                  <>
                    <h2 className="font-display mb-4" style={{ fontSize: 24, letterSpacing: "-0.3px", color: "#111", fontWeight: 700 }}>{(focusedItem.data as BlogPost).title}</h2>
                    <div className="blog-prose" dangerouslySetInnerHTML={{ __html: (focusedItem.data as BlogPost).content_html }} />
                  </>
                ) : (
                  <>
                    {(focusedItem.data as SocialPost).image_url && (
                      <img src={(focusedItem.data as SocialPost).image_url!} alt="" className="w-full rounded-xl mb-4" style={{ height: "auto" }} />
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3" style={{ color: "#111" }}>{(focusedItem.data as SocialPost).caption}</p>
                    {(focusedItem.data as SocialPost).hashtags?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(focusedItem.data as SocialPost).hashtags!.map((t) => (
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
