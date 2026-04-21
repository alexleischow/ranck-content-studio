import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { content_type, content_id, week_package_id, body, author } = await req.json();
    const supabase = await createServiceClient();
    const { error } = await supabase.from("content_comments").insert({
      content_type,
      content_id,
      week_package_id,
      body,
      author: author ?? "Client",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
