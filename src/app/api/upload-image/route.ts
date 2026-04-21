import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const postId = formData.get("postId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File must be JPG, PNG, WebP, or GIF" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `social-images/${Date.now()}-upload.${ext}`;

    const supabase = await createServiceClient();

    const { error: uploadError } = await supabase.storage
      .from("social-images")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("social-images")
      .getPublicUrl(filename);

    if (postId) {
      await supabase.from("social_posts").update({ image_url: publicUrl }).eq("id", postId);
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
