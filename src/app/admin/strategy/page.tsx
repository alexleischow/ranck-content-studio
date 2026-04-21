"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { Strategy } from "@/types/database";
import { Loader2, Sparkles, Save } from "lucide-react";
import { MINT, SLATE } from "@/lib/btn";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const inputStyle = {
  backgroundColor: "#fff",
  boxShadow: "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.04) 0px 1px 3px 0px",
  border: "none",
  borderRadius: 8,
  color: "#111",
  fontSize: 14,
};

export default function StrategyPage() {
  const supabase = createClient();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("Ranck Plumbing, Heating, AC & Excavation");
  const [location, setLocation] = useState("Lancaster, PA");
  const [services, setServices] = useState("plumbing, heating, air conditioning, sewer & excavation");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("strategy").select("*").limit(1).single();
    if (data) setStrategy(data as Strategy);
    setLoading(false);
  }

  async function generate() {
    if (!location) { toast.error("Enter the company's location"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-strategy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, location, services }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const saveRes = await fetch("/api/save-strategy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy?.id ?? null, data, companyName }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error);
      setStrategy(saved as Strategy);
      toast.success("Strategy generated and saved");
    } catch (e: any) { toast.error(e.message || "Generation failed"); }
    finally { setGenerating(false); }
  }

  async function save() {
    if (!strategy) return;
    setSaving(true);
    try {
      const res = await fetch("/api/save-strategy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: strategy.id, data: {}, companyName: strategy.company_name }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Strategy saved");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="label-kicker mb-2">Planning</p>
          <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>
            Strategy
          </h1>
        </div>
        {strategy && (
          <button className={`${SLATE} gap-2`} onClick={save} disabled={saving}>
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        )}
      </div>

      {/* Generator */}
      <div className="vg-card p-6 mb-6 space-y-4">
        <p className="text-sm font-semibold" style={{ color: "#111" }}>Generate Strategy</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Company Name</Label>
            <Input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Location / Market</Label>
            <Input style={inputStyle} placeholder="Lancaster, PA" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>Services Offered</Label>
            <Input style={inputStyle} value={services} onChange={(e) => setServices(e.target.value)} />
          </div>
        </div>
        <button className={`${MINT} gap-2`} onClick={generate} disabled={generating}>
          {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> {strategy ? "Regenerate Strategy" : "Generate Strategy"}</>}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {strategy && (
        <div className="space-y-4">
          {/* Overview */}
          <div className="vg-card p-6 space-y-5">
            <p className="text-sm font-semibold" style={{ color: "#111" }}>Overview</p>
            <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{strategy.overview}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Target Audience</p>
                <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{strategy.target_audience}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Brand Voice</p>
                <p className="text-sm leading-relaxed" style={{ color: "#444" }}>{strategy.brand_voice}</p>
              </div>
            </div>
            {strategy.content_pillars && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Content Pillars</p>
                <div className="flex flex-wrap gap-2">
                  {strategy.content_pillars.map((pillar) => (
                    <span key={pillar} className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: "var(--surface-2)", color: "#111" }}>
                      {pillar}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Plan */}
          {strategy.daily_plan && (
            <div className="vg-card p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: "#111" }}>Daily Posting Plan</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {DAYS.map((day) => {
                  const tasks = (strategy.daily_plan as any)?.[day] ?? [];
                  return (
                    <div key={day} className="rounded-lg p-3" style={{ backgroundColor: "var(--surface-2)" }}>
                      <p className="text-xs font-semibold mb-2 capitalize" style={{ color: "#111" }}>{day}</p>
                      <ul className="space-y-1">
                        {tasks.map((task: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "#555" }}>
                            <span style={{ color: "var(--text-muted)" }}>›</span> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Plan */}
          {strategy.weekly_plan && (
            <div className="vg-card p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: "#111" }}>Weekly Content Mix</p>
              <div className="space-y-3">
                {Object.entries(strategy.weekly_plan as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="flex gap-4 text-sm py-2 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <span className="text-xs font-semibold w-36 shrink-0 capitalize" style={{ color: "#111" }}>
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm" style={{ color: "#444" }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Plan */}
          {strategy.monthly_plan && (
            <div className="vg-card p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: "#111" }}>Monthly Themes</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {["week1", "week2", "week3", "week4"].map((w) => (
                  <div key={w} className="rounded-lg p-4" style={{ backgroundColor: "var(--surface-2)" }}>
                    <p className="text-xs font-semibold mb-1 capitalize" style={{ color: "#111" }}>
                      {w.replace("week", "Week ")}
                    </p>
                    <p className="text-sm" style={{ color: "#444" }}>{(strategy.monthly_plan as any)?.[w]}</p>
                  </div>
                ))}
              </div>
              {(strategy.monthly_plan as any)?.monthly_theme_examples && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Monthly Theme Examples</p>
                  <div className="flex flex-wrap gap-2">
                    {((strategy.monthly_plan as any).monthly_theme_examples as string[]).map((t) => (
                      <span key={t} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--surface-2)", color: "#555" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
