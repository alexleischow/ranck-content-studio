import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { SYSTEM_CONTEXT } from "@/lib/ai/prompts";

const client = new Anthropic();

async function refineSocialPost(post: any): Promise<{ caption: string; hashtags: string[] }> {
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

Rewrite this post so it:
- Sounds like the real Ranck posts shown above (casual, warm, community-first, local)
- Has NO em-dashes anywhere
- Has NO AI buzzwords (leverage, comprehensive, seamless, robust, state-of-the-art, etc.)
- Uses short sentences with line breaks between thoughts
- Ends with: JustCallRanck.com | (717) 912-6176
- Includes all three brand hashtags: #JustCallRanck #TrustRanck #RanckCares
- Includes 3-5 local town hashtags from: #akronpa #hersheypa #lititzpa #ephratapa #wyomissingpa #quarryvillepa #easternyorkpa #wrightsvillepa #lebanonpa #lancasterpa
- Keeps the same core topic and message — just rewritten in Ranck's real voice

Return JSON only:
{"caption":"...","hashtags":["tag1","tag2"]}`,
    }],
  });

  const raw = (message.content[0] as any).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

async function refineBlogPost(post: any): Promise<{ title: string; content_html: string; excerpt: string }> {
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

Rewrite this blog post so it:
- Sounds like it was written by a knowledgeable Lancaster County neighbor, not a content farm
- Has NO em-dashes anywhere (use commas or periods instead)
- Has NO AI buzzwords (leverage, comprehensive, seamless, robust, state-of-the-art, etc.)
- Uses short paragraphs and plain, direct language
- Keeps "we" and "our team" voice throughout
- Preserves the same topic, SEO intent, and structure (same H2 sections are fine)
- Maintains the same approximate length

Return JSON only:
{"title":"...","content_html":"...","excerpt":"..."}`,
    }],
  });

  const raw = (message.content[0] as any).text;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  const { type = "all" } = await req.json().catch(() => ({}));
  const supabase = await createServiceClient();

  const results = { updated: 0, errors: 0, errorDetails: [] as string[] };

  if (type === "all" || type === "social") {
    const { data: socials } = await supabase
      .from("social_posts")
      .select("id, platform, caption, hashtags")
      .neq("status", "published");

    for (const post of socials ?? []) {
      try {
        const updated = await refineSocialPost(post);
        await supabase
          .from("social_posts")
          .update({ caption: updated.caption, hashtags: updated.hashtags })
          .eq("id", post.id);
        results.updated++;
      } catch (e: any) {
        results.errors++;
        results.errorDetails.push(`social:${post.id} — ${e.message}`);
      }
    }
  }

  if (type === "all" || type === "blog") {
    const { data: blogs } = await supabase
      .from("blog_posts")
      .select("id, title, content_html, excerpt")
      .neq("status", "published");

    for (const post of blogs ?? []) {
      try {
        const updated = await refineBlogPost(post);
        await supabase
          .from("blog_posts")
          .update({ title: updated.title, content_html: updated.content_html, excerpt: updated.excerpt })
          .eq("id", post.id);
        results.updated++;
      } catch (e: any) {
        results.errors++;
        results.errorDetails.push(`blog:${post.id} — ${e.message}`);
      }
    }
  }

  return NextResponse.json(results);
}
