export const dynamic = "force-dynamic";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ClientPortal from "./ClientPortal";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: pkg } = await supabase
    .from("week_packages")
    .select("*")
    .eq("review_token", token)
    .single();

  if (!pkg) notFound();

  const [{ data: blogs }, { data: socials }, { data: comments }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("week_package_id", pkg.id),
    supabase.from("social_posts").select("*").eq("week_package_id", pkg.id),
    supabase.from("content_comments").select("*").eq("week_package_id", pkg.id).order("created_at"),
  ]);

  return (
    <ClientPortal
      pkg={pkg}
      blogs={blogs ?? []}
      socials={socials ?? []}
      comments={comments ?? []}
    />
  );
}
