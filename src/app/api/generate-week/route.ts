import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyTopics } from "@/lib/ai/generate";

export async function POST(req: NextRequest) {
  try {
    const { weekStart } = await req.json();
    if (!weekStart) return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
    const result = await generateWeeklyTopics(weekStart);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
