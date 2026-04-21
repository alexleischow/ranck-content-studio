import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { imagePrompt, platform, postId } = await req.json();
    if (!imagePrompt) return NextResponse.json({ error: "imagePrompt is required" }, { status: 400 });

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Professional social media photo for a painting company. ${imagePrompt}. Photorealistic, high quality, suitable for ${platform} marketing. No text or watermarks.`,
      size: platform === "instagram" ? "1024x1024" : "1792x1024",
      quality: "standard",
      n: 1,
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) throw new Error("No image URL returned from DALL-E");

    // Download the image (DALL-E URLs expire after 1 hour)
    const imageRes = await fetch(tempUrl);
    if (!imageRes.ok) throw new Error("Failed to download generated image");
    const buffer = await imageRes.arrayBuffer();

    // Upload to Supabase Storage
    const supabase = await createServiceClient();
    const filename = `social-images/${Date.now()}-${platform}.png`;

    const { error: uploadError } = await supabase.storage
      .from("social-images")
      .upload(filename, buffer, { contentType: "image/png", upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("social-images")
      .getPublicUrl(filename);

    // If a postId was provided, update the record with the permanent URL
    if (postId) {
      await supabase.from("social_posts").update({ image_url: publicUrl }).eq("id", postId);
    }

    return NextResponse.json({ image_url: publicUrl });
  } catch (e: any) {
    console.error("Image generation error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
