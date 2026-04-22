import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { SYSTEM_CONTEXT } from "@/lib/ai/prompts";

export const maxDuration = 300;

async function refineSocialPost(client: Anthropic, post: any): Promise<{ caption: string; hashtags: string[] }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `${SYSTEM_CONTEXT}

## Task: Rewrite this existing ${post.platform} post to match Ranck's authentic voice

Current caption:
${post.caption}

Current hashtags: ${(post.hashtags ?? []).join(", ")}

Rewrite this post so it sounds like that 50-year-old woman from Lititz — warm, plain, neighborly, not like marketing copy. Keep the same core topic. End with JustCallRanck.com | (717) 912-6176 and include #JustCallRanck #TrustRanck #RanckCares plus 3-5 local town hashtags.

Return JSON only:
{"caption":"...","hashtags":["tag1","tag2"]}`,
    }],
  });

  const raw = (message.content[0] as any).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

async function refineBlogPost(client: Anthropic, post: any): Promise<{ title: string; content_html: string; excerpt: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `${SYSTEM_CONTEXT}

## Task: Rewrite this existing blog post to match Ranck's authentic voice

Current title: ${post.title}
Current excerpt: ${post.excerpt}
Current HTML content:
${post.content_html}

Rewrite this so it sounds like a real person who's been doing HVAC and plumbing in Lancaster County for decades — plain language, short paragraphs, no corporate fluff, no em-dashes. Keep the same topic and structure.

Return JSON only:
{"title":"...","content_html":"...","excerpt":"..."}`,
    }],
  });

  const raw = (message.content[0] as any).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

async function runBatch<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { type = "all" } = await req.json().catch(() => ({}));
  const supabase = await createServiceClient();

  const results = { updated: 0, errors: 0, errorDetails: [] as string[] };

  if (type === "all" || type === "social") {
    const { data: socials, error } = await supabase
      .from("social_posts")
      .select("id, platform, caption, hashtags")
      .neq("status", "published");

    if (error) {
      results.errorDetails.push(`fetch social_posts: ${error.message}`);
    } else {
      await runBatch(socials ?? [], 3, async (post) => {
        try {
          const updated = await refineSocialPost(client, post);
          const { error: updateError } = await supabase
            .from("social_posts")
            .update({ caption: updated.caption, hashtags: updated.hashtags })
            .eq("id", post.id);
          if (updateError) throw new Error(updateError.message);
          results.updated++;
        } catch (e: any) {
          results.errors++;
          results.errorDetails.push(`social:${post.id} — ${e.message}`);
        }
      });
    }
  }

  if (type === "all" || type === "blog") {
    const { data: blogs, error } = await supabase
      .from("blog_posts")
      .select("id, title, content_html, excerpt")
      .neq("status", "published");

    if (error) {
      results.errorDetails.push(`fetch blog_posts: ${error.message}`);
    } else {
      await runBatch(blogs ?? [], 2, async (post) => {
        try {
          const updated = await refineBlogPost(client, post);
          const { error: updateError } = await supabase
            .from("blog_posts")
            .update({ title: updated.title, content_html: updated.content_html, excerpt: updated.excerpt })
            .eq("id", post.id);
          if (updateError) throw new Error(updateError.message);
          results.updated++;
        } catch (e: any) {
          results.errors++;
          results.errorDetails.push(`blog:${post.id} — ${e.message}`);
        }
      });
    }
  }

  console.log("bulk-refine results:", results);
  return NextResponse.json(results);
}
