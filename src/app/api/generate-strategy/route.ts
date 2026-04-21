import { NextRequest, NextResponse } from "next/server";
import { generateStrategy } from "@/lib/ai/generate";

export async function POST(req: NextRequest) {
  try {
    const { companyName, location, services } = await req.json();
    if (!location) return NextResponse.json({ error: "Location is required" }, { status: 400 });
    const result = await generateStrategy(companyName, location, services);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
