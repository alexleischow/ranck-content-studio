import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost } from "@/lib/ai/generate";

export async function POST(req: NextRequest) {
  try {
    const { topic, keywords } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    const result = await generateBlogPost(topic, keywords ?? "");
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
