"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function BulkRefineButton({ postCount }: { postCount: number }) {
  const [running, setRunning] = useState(false);

  async function run() {
    if (!confirm(`This will rewrite all ${postCount} non-published posts to match Ranck's authentic voice. Continue?`)) return;
    setRunning(true);
    try {
      const res = await fetch("/api/bulk-refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      const data = await res.json();
      if (data.errors > 0) {
        toast.warning(`Done — ${data.updated} posts updated, ${data.errors} errors.`);
      } else {
        toast.success(`All ${data.updated} posts rewritten in Ranck's voice.`);
      }
    } catch {
      toast.error("Something went wrong. Check the console.");
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
      {running ? "Rewriting posts…" : `Refresh Voice (${postCount} posts)`}
    </button>
  );
}
