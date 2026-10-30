import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const courseFilesBucket = "course-files";
const imagePathPattern = /\.(?:avif|jpe?g|png|webp)$/i;

function courseFilePath(value: string) {
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");

  try {
    const url = new URL(value);
    const marker = `/${courseFilesBucket}/`;
    const index = url.pathname.indexOf(marker);
    return index === -1 ? null : decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

// Images are intentionally public: this stable URL lets Vercel cache them at
// the edge. The Storage bucket stays private, so PDFs and other course files
// are still served by the protected /api/course-file route.
export async function GET(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("path");
  const filePath = value ? courseFilePath(value) : null;

  if (!filePath || filePath.includes("..") || !imagePathPattern.test(filePath)) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const requestedWidth = Number(request.nextUrl.searchParams.get("width"));
  const original = request.nextUrl.searchParams.get("original") === "1";
  const width = requestedWidth === 480 || requestedWidth === 960 || requestedWidth === 1600 || requestedWidth === 2400 ? requestedWidth : 1600;
  // Covers are a focal part of the storefront. They are cached by their
  // versioned URL, so preserve fine detail instead of over-compressing them.
  const quality = width <= 960 ? 88 : 92;
  const { data, error } = await getSupabaseAdmin().storage
    .from(courseFilesBucket)
    .createSignedUrl(filePath, 60, original ? undefined : {
      transform: { width, resize: "contain", quality },
    });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const source = await fetch(data.signedUrl, { cache: "no-store" });
  if (!source.ok || !source.body) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const cacheControl = "public, max-age=31536000, s-maxage=31536000, immutable";
  const headers = new Headers({
    "Content-Type": source.headers.get("content-type") ?? "image/webp",
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Vercel-CDN-Cache-Control": cacheControl,
  });
  const contentLength = source.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(source.body, { headers });
}
