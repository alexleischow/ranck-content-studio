"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Package,
  BarChart3,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/generate", label: "Generate", icon: Sparkles },
  { href: "/admin/packages", label: "Week Packages", icon: Package },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/strategy", label: "Strategy", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--canvas)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ backgroundColor: "var(--canvas)", boxShadow: "rgba(34,42,53,0.08) 1px 0 0 0" }}
      >
        {/* Wordmark */}
        <div className="px-5 pt-6 pb-5" style={{ boxShadow: "rgba(34,42,53,0.08) 0 1px 0 0" }}>
          <p className="font-display leading-none" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px", color: "#111" }}>
            Ranck Inc.
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            Content Studio
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  active ? "font-medium" : "font-normal"
                )}
                style={{
                  color: active ? "#111" : "var(--text-muted)",
                  backgroundColor: active ? "var(--surface-2)" : "transparent",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span style={{ fontSize: 13 }}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="px-4 py-5" style={{ boxShadow: "rgba(34,42,53,0.08) 0 -1px 0 0" }}>
          <p className="text-xs font-semibold" style={{ color: "#111", marginBottom: 2 }}>Client Portal</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Share review links from Week Packages
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "var(--canvas)" }}>
        {children}
      </main>
    </div>
  );
}
