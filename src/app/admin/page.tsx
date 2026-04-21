export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Share2, CheckCircle2, Clock, Sparkles, ArrowRight } from "lucide-react";
import BulkRefineButton from "@/components/BulkRefineButton";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: packages }, { data: blogs }, { data: socials }] = await Promise.all([
    supabase.from("week_packages").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("blog_posts").select("id, status").limit(100),
    supabase.from("social_posts").select("id, status").limit(100),
  ]);

  const stats = {
    totalBlogs: blogs?.length ?? 0,
    approvedBlogs: blogs?.filter((b: any) => b.status === "approved").length ?? 0,
    totalSocial: socials?.length ?? 0,
    approvedSocial: socials?.filter((s: any) => s.status === "approved").length ?? 0,
    packages: packages?.length ?? 0,
    pendingReview: packages?.filter((p: any) => p.status === "pending_review").length ?? 0,
  };

  const nonPublishedCount =
    (blogs?.filter((b: any) => b.status !== "published").length ?? 0) +
    (socials?.filter((s: any) => s.status !== "published").length ?? 0);

  const pkgStatusColor: Record<string, { bg: string; text: string }> = {
    pending_review:    { bg: "#dbeafe", text: "#1d4ed8" },
    changes_requested: { bg: "#fee2e2", text: "#b91c1c" },
    approved:          { bg: "#dcfce7", text: "#15803d" },
  };

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="label-kicker mb-2">Overview</p>
          <h1 className="font-display" style={{ fontSize: 38, lineHeight: 1, letterSpacing: "-0.5px", color: "#111", fontWeight: 700 }}>
            Dashboard
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="pt-2">
          <BulkRefineButton postCount={nonPublishedCount} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {[
          { icon: FileText,    color: "#6366f1", bg: "#eef2ff", label: "Blog Posts",      value: stats.totalBlogs,    sub: `${stats.approvedBlogs} approved` },
          { icon: Share2,      color: "#0ea5e9", bg: "#e0f2fe", label: "Social Posts",    value: stats.totalSocial,   sub: `${stats.approvedSocial} approved` },
          { icon: CheckCircle2,color: "#16a34a", bg: "#dcfce7", label: "Week Packages",   value: stats.packages,      sub: "total created" },
          { icon: Clock,       color: "#d97706", bg: "#fef3c7", label: "Awaiting Review", value: stats.pendingReview, sub: "from client" },
        ].map(({ icon: Icon, color, bg, label, value, sub }) => (
          <div key={label} className="vg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
            </div>
            <p className="font-display" style={{ fontSize: 32, lineHeight: 1, color: "#111", fontWeight: 700 }}>{value}</p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <p className="label-kicker mb-4">Quick Actions</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-10">
        {[
          { href: "/admin/generate", color: "#6366f1", bg: "#eef2ff", label: "Generate Content", sub: "Blog posts & social copy", Icon: Sparkles },
          { href: "/admin/packages", color: "#0ea5e9", bg: "#e0f2fe", label: "Week Packages",    sub: "Send client review links", Icon: Share2 },
          { href: "/admin/strategy", color: "#16a34a", bg: "#dcfce7", label: "Strategy",         sub: "Posting plan & pillars",   Icon: FileText },
        ].map(({ href, color, bg, label, sub, Icon }) => (
          <Link key={href} href={href}>
            <div className="vg-card p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: "#111" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent packages */}
      {packages && packages.length > 0 && (
        <>
          <p className="label-kicker mb-4">Recent Packages</p>
          <div className="vg-card overflow-hidden">
            {(packages as any[]).map((pkg, i) => {
              const s = pkgStatusColor[pkg.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
              return (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: i < packages.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#111" }}>{pkg.week_label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(pkg.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
                      {pkg.status.replace(/_/g, " ")}
                    </span>
                    <Link href="/admin/packages" className="text-xs font-medium" style={{ color: "#111" }}>
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
