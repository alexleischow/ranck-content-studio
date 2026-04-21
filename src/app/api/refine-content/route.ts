import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { type, id, instructions, currentContent } = await req.json();
  if (!type || !id || !instructions) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = await createServiceClient();

  try {
    if (type === "blog") {
      const { title, content_html, excerpt } = currentContent;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: `You are editing a blog post for Ranck Plumbing, Heating, AC & Excavation (Lancaster, PA).

Current title: ${title}
Current excerpt: ${excerpt}
Current HTML content:
${content_html}

Instructions from the user: ${instructions}

Apply the instructions and return the updated post as JSON with this exact structure:
{"title":"...","content_html":"...","excerpt":"..."}

Return ONLY valid JSON, no other text.`,
        }],
      });

      const raw = (message.content[0] as any).text;
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const updated = JSON.parse(match[0]);

      await supabase.from("blog_posts").update({
        title: updated.title,
        content_html: updated.content_html,
        excerpt: updated.excerpt,
      }).eq("id", id);

      return NextResponse.json(updated);
    }

    if (type === "social") {
      const { caption, hashtags, platform } = currentContent;
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `You are editing a ${platform} social media post for Ranck Plumbing, Heating, AC & Excavation (Lancaster, PA).

Current caption:
${caption}

Current hashtags: ${(hashtags ?? []).join(", ")}

Instructions from the user: ${instructions}

Apply the instructions and return the updated post as JSON:
{"caption":"...","hashtags":["tag1","tag2"]}

Return ONLY valid JSON, no other text.`,
        }],
      });

      const raw = (message.content[0] as any).text;
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const updated = JSON.parse(match[0]);

      await supabase.from("social_posts").update({
        caption: updated.caption,
        hashtags: updated.hashtags,
      }).eq("id", id);

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
