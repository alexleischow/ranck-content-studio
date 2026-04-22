"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BulkRefineButton({ postCount }: { postCount: number }) {
  const [running, setRunning] = useState(false);
  const router = useRouter();

  async function run() {
    if (!confirm(`This will rewrite all ${postCount} non-published posts in Ranck's authentic voice. This may take a few minutes. Continue?`)) return;
    setRunning(true);
    try {
      const res = await fetch("/api/bulk-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();

      if (data.errors > 0) {
        toast.warning(`Done — ${data.updated} posts updated, ${data.errors} failed. Check console for details.`);
        console.error("Bulk refine errors:", data.errorDetails);
      } else {
        toast.success(`${data.updated} posts rewritten. Reloading…`);
      }

      // Reload so the updated content is visible right away
      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      console.error("Bulk refine failed:", e);
      toast.error(`Failed: ${e.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <button
      onClick={run}
      disabled={running || postCount === 0}
      className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
    >
      <Wand2 className="w-4 h-4" />
      {running ? "Rewriting posts… (this takes a few minutes)" : `Refresh Voice (${postCount} posts)`}
    </button>
  );
}
