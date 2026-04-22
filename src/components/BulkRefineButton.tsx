"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BulkRefineButton({ postCount }: { postCount: number }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const router = useRouter();

  async function run() {
    if (!confirm(`This will rewrite all ${postCount} non-published posts in Ranck's authentic voice. Continue?`)) return;
    setRunning(true);

    const supabase = createClient();
    let updated = 0;
    let errors = 0;

    try {
      // Fetch all non-published posts (just the fields we need)
      const [{ data: socials }, { data: blogs }] = await Promise.all([
        supabase.from("social_posts").select("id, platform, caption, hashtags").neq("status", "published"),
        supabase.from("blog_posts").select("id, title, content_html, excerpt").neq("status", "published"),
      ]);

      const socialList = socials ?? [];
      const blogList = blogs ?? [];
      const total = socialList.length + blogList.length;

      if (total === 0) {
        toast.info("No posts to rewrite.");
        setRunning(false);
        return;
      }

      // Rewrite each social post one at a time
      for (let i = 0; i < socialList.length; i++) {
        const post = socialList[i];
        setProgress(`Rewriting post ${i + 1} of ${total}…`);
        try {
          const res = await fetch("/api/refine-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "social",
              id: post.id,
              instructions: "Rewrite this completely in Ranck's authentic voice. Warm, simple, plain language — like a 50-year-old woman from Lititz who's been doing this her whole life talking to neighbors. No marketing words, no em-dashes, no punchy hooks. End with JustCallRanck.com | (717) 912-6176 and include #JustCallRanck #TrustRanck #RanckCares plus local town hashtags.",
              currentContent: { caption: post.caption, hashtags: post.hashtags, platform: post.platform },
            }),
          });
          if (res.ok) updated++;
          else errors++;
        } catch {
          errors++;
        }
      }

      // Rewrite each blog post one at a time
      for (let i = 0; i < blogList.length; i++) {
        const post = blogList[i];
        setProgress(`Rewriting post ${socialList.length + i + 1} of ${total}…`);
        try {
          const res = await fetch("/api/refine-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "blog",
              id: post.id,
              instructions: "Rewrite this completely in Ranck's authentic voice. Plain language, short paragraphs, no em-dashes, no corporate words. Should sound like a real person who's been doing HVAC and plumbing in Lancaster County for decades — not polished marketing copy.",
              currentContent: { title: post.title, content_html: post.content_html, excerpt: post.excerpt },
            }),
          });
          if (res.ok) updated++;
          else errors++;
        } catch {
          errors++;
        }
      }

      if (errors > 0) {
        toast.warning(`Done — ${updated} posts updated, ${errors} failed.`);
      } else {
        toast.success(`All ${updated} posts rewritten in Ranck's voice.`);
      }

      setTimeout(() => router.refresh(), 800);
    } catch (e: any) {
      console.error("Bulk refine failed:", e);
      toast.error(`Failed: ${e.message}`);
    } finally {
      setRunning(false);
      setProgress("");
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
      {running ? (progress || "Starting…") : `Refresh Voice (${postCount} posts)`}
    </button>
  );
}
