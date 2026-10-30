import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const bucket = "course-files";
const pdfCacheTtlMs = 3 * 60 * 1000;
type CachedPdf = { expiresAt: number; bytes: Promise<Uint8Array> };

function pdfCache() {
  const scope = globalThis as typeof globalThis & { __byAlinkinsPdfCache?: Map<string, CachedPdf> };
  if (!scope.__byAlinkinsPdfCache) scope.__byAlinkinsPdfCache = new Map();
  return scope.__byAlinkinsPdfCache;
}

async function loadPdfBytes(path: string) {
  const cache = pdfCache();
  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expiresAt > now) return new Uint8Array(await cached.bytes);

  const bytes = getSupabaseAdmin().storage.from(bucket).download(path).then(async ({ data, error }) => {
    if (error || !data) throw new Error("PDF not found");
    return new Uint8Array(await data.arrayBuffer());
  });
  cache.set(path, { expiresAt: now + pdfCacheTtlMs, bytes });
  try {
    return new Uint8Array(await bytes);
  } catch (error) {
    cache.delete(path);
    throw error;
  }
}

function storagePath(value: string) {
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");

  try {
    const url = new URL(value);
    const marker = `/${bucket}/`;
    const index = url.pathname.indexOf(marker);
    return index === -1 ? null : decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requestUrl = new URL(request.url);
  const value = requestUrl.searchParams.get("path");
  const path = value ? storagePath(value) : null;
  const pageNumber = Number(requestUrl.searchParams.get("page"));
  if (!path || path.includes("..") || !/\.pdf$/i.test(path) || !Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Invalid PDF page request" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const [lessonPdfs, blockContent, profileResult] = await Promise.all([
    admin.from("lessons").select("course_id").eq("pdf_path", path),
    admin.from("lesson_blocks").select("lesson_id").eq("content", path),
    supabase.from("profiles").select("is_admin,first_name").eq("id", user.id).maybeSingle(),
  ]);
  const blockLessonIds = (blockContent.data ?? []).map((block) => block.lesson_id);
  const { data: blockLessons } = blockLessonIds.length
    ? await admin.from("lessons").select("course_id").in("id", blockLessonIds)
    : { data: [] as { course_id: string }[] };
  const courseIds = [...new Set([
    ...(lessonPdfs.data ?? []).map((lesson) => lesson.course_id),
    ...(blockLessons ?? []).map((lesson) => lesson.course_id),
  ])];
  if (!courseIds.length) return NextResponse.json({ error: "PDF not found" }, { status: 404 });

  if (!profileResult.data?.is_admin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .in("course_id", courseIds)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  let sourceBytes: Uint8Array;
  try { sourceBytes = await loadPdfBytes(path); }
  catch { return NextResponse.json({ error: "PDF not found" }, { status: 404 }); }

  let loadingTask: any = null;
  let stage = "opening the source document";
  try {
    // PDF.js expects browser geometry classes during module initialization.
    // The server gets compatible implementations from the Canvas runtime.
    Object.assign(globalThis, { DOMMatrix, ImageData, Path2D });
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
    loadingTask = pdfjsLib.getDocument({ data: sourceBytes });
    stage = "reading the PDF structure";
    const pdf = await loadingTask.promise;
    if (pageNumber > pdf.numPages) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const maxPixels = 8_000_000;
    const scale = Math.min(2, Math.sqrt(maxPixels / (baseViewport.width * baseViewport.height)));
    const viewport = page.getViewport({ scale });
    stage = "creating the page image";
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    await page.render({ canvasContext: context as unknown as CanvasRenderingContext2D, viewport }).promise;

    stage = "encoding the page image";
    const image = canvas.toBuffer("image/webp", 92);
    const pageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"><image width="${canvas.width}" height="${canvas.height}" href="data:image/webp;base64,${image.toString("base64")}"/></svg>`;
    const svgBuffer = Buffer.from(pageSvg);
    const imageBody = new Uint8Array(svgBuffer.buffer.slice(svgBuffer.byteOffset, svgBuffer.byteOffset + svgBuffer.byteLength) as ArrayBuffer);
    return new Response(imageBody, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Length": String(svgBuffer.length),
        // Keep protected guide pages out of shared/CDN caches, but let this
        // signed-in browser reuse rendered pages after a refresh.
        "Cache-Control": "private, max-age=3600",
        "Vary": "Cookie",
        "X-PDF-Page-Count": String(pdf.numPages),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PDF page rendering failed", { path, pageNumber, error });
    return NextResponse.json({ error: "Unable to display this PDF page", stage }, { status: 500 });
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
  }
}
