import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost, generateSocialPost } from "@/lib/ai/generate";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 300;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<any>,
  delayMs = 800
): Promise<any[]> {
  const results: any[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) await delay(delayMs);
  }
  return results;
}

export async function POST(req: NextRequest) {
  try {
    const { weekStart, weekPlan } = await req.json();
    const supabase = await createServiceClient();

    const { blog_topics, social_topics, week_theme } = weekPlan;

    // Blogs in batches of 1 (sequential) — each is large, avoid rate limits
    const blogResults = await runInBatches(
      blog_topics,
      1,
      (b: { topic: string; keywords: string }) => generateBlogPost(b.topic, b.keywords),
      1000
    );

    // Social posts in batches of 3 (one per platform at a time)
    const socialResults = await runInBatches(
      social_topics,
      3,
      (s: { platform: "linkedin" | "instagram" | "facebook"; topic: string }) =>
        generateSocialPost(s.platform, s.topic, week_theme).then((r) => ({ ...r, platform: s.platform })),
      800
    );

    const [{ error: blogError }, { error: socialError }] = await Promise.all([
      supabase.from("blog_posts").insert(blogResults.map((b) => ({ ...b, status: "draft" }))),
      supabase.from("social_posts").insert(socialResults.map((s) => ({ ...s, status: "draft" }))),
    ]);

    if (blogError) throw blogError;
    if (socialError) throw socialError;

    return NextResponse.json({ blogs: blogResults.length, socials: socialResults.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
