import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { type, id, status, client_notes } = await req.json();
    const supabase = await createServiceClient();

    if (type === "blog_post") {
      const { error } = await supabase.from("blog_posts").update({ status }).eq("id", id);
      if (error) throw error;
    } else if (type === "social_post") {
      const { error } = await supabase.from("social_posts").update({ status }).eq("id", id);
      if (error) throw error;
    } else if (type === "week_package") {
      const update: Record<string, unknown> = { status };
      if (client_notes !== undefined) update.client_notes = client_notes;
      const { error } = await supabase.from("week_packages").update(update).eq("id", id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
