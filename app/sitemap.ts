import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alinkinscodex.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["/", "/home", "/privacypolicy", "/termsofuse", "/disclaimer"].map((path) => ({ url: new URL(path, siteUrl).toString(), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
  try {
    const { data } = await getSupabaseAdmin().from("courses").select("slug").eq("published", true);
    return [...pages, ...(data ?? []).map((course) => ({ url: new URL(`/courses/${course.slug}`, siteUrl).toString(), changeFrequency: "weekly" as const, priority: 0.9 }))];
  } catch {
    return pages;
  }
}
