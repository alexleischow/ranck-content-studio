import { NextRequest, NextResponse } from "next/server";
import { generateSocialPost } from "@/lib/ai/generate";

export async function POST(req: NextRequest) {
  try {
    const { platform, topic, weekTheme } = await req.json();
    if (!platform || !topic) return NextResponse.json({ error: "Platform and topic required" }, { status: 400 });
    const result = await generateSocialPost(platform, topic, weekTheme ?? "");
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
