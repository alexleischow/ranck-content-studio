import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyTopics, generateBlogPost, generateSocialPost } from "@/lib/ai/generate";
import { createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { format, addDays, nextMonday } from "date-fns";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel (or you) can trigger this
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Target the coming Monday
    const monday = nextMonday(new Date());
    const weekStart = format(monday, "yyyy-MM-dd");
    const weekLabel = `Week of ${format(monday, "MMMM d, yyyy")}`;

    // 1. Generate topic plan
    const weekPlan = await generateWeeklyTopics(weekStart);
    const { blog_topics, social_topics, week_theme } = weekPlan;

    // 2. Create the week package first (so we have an ID)
    const review_token = randomBytes(16).toString("hex");
    const { data: pkg, error: pkgError } = await supabase
      .from("week_packages")
      .insert({ week_label: weekLabel, week_start: weekStart, review_token, status: "pending_review" })
      .select()
      .single();
    if (pkgError) throw pkgError;

    // 3. Generate all content in parallel
    const [blogResults, socialResults] = await Promise.all([
      Promise.all(
        (blog_topics ?? []).map((b: { topic: string; keywords: string }) =>
          generateBlogPost(b.topic, b.keywords)
        )
      ),
      Promise.all(
        (social_topics ?? []).map((s: { platform: "linkedin" | "instagram" | "facebook"; topic: string }) =>
          generateSocialPost(s.platform, s.topic, week_theme).then((r) => ({ ...r, platform: s.platform }))
        )
      ),
    ]);

    // 4. Save all content linked to the new package
    const [{ error: blogError }, { error: socialError }] = await Promise.all([
      supabase.from("blog_posts").insert(
        blogResults.map((b) => ({ ...b, status: "draft", week_package_id: pkg.id }))
      ),
      supabase.from("social_posts").insert(
        socialResults.map((s) => ({ ...s, status: "draft", week_package_id: pkg.id }))
      ),
    ]);
    if (blogError) throw blogError;
    if (socialError) throw socialError;

    // 5. Generate images for social posts in the background (fire and forget)
    const { data: savedSocials } = await supabase
      .from("social_posts")
      .select("id, platform, image_prompt")
      .eq("week_package_id", pkg.id);

    (savedSocials ?? []).forEach(async (post: any) => {
      if (!post.image_prompt) return;
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        await fetch(`${baseUrl}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePrompt: post.image_prompt, platform: post.platform, postId: post.id }),
        });
      } catch {}
    });

    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portal/${review_token}`;

    return NextResponse.json({
      success: true,
      weekLabel,
      weekStart,
      blogs: blogResults.length,
      socials: socialResults.length,
      packageId: pkg.id,
      reviewUrl,
    });
  } catch (e: any) {
    console.error("Cron generate-week error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
