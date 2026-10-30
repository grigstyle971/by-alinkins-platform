import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function playbackId(content: string) {
  const value = content.trim();
  const direct = value.match(/^(?:mux:\/\/)?([A-Za-z0-9]+)$/);
  if (direct) return direct[1];
  try {
    const url = new URL(value);
    if (url.hostname === "stream.mux.com") return url.pathname.match(/^\/([A-Za-z0-9]+)\.m3u8$/)?.[1] ?? null;
  } catch { /* Ignore non-Mux blocks. */ }
  return null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data: lesson, error: lessonError } = await admin.from("lessons").select("course_id").eq("id", id).single();
  if (lessonError || !lesson) return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  const { data: lessons, error } = await admin.from("lessons")
    .select("id,lesson_blocks(id,kind,content,thumbnail_path)").eq("course_id", lesson.course_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const sourceVideos = (lessons ?? []).find((item) => item.id === id)?.lesson_blocks.filter((block) => block.kind === "video") ?? [];
  const videos = (lessons ?? []).filter((item) => item.id !== id).flatMap((item) => item.lesson_blocks).filter((block) => block.kind === "video");
  const covers = new Map<string, Set<string>>();
  for (const block of sourceVideos) {
    const key = playbackId(block.content);
    if (!key || !block.thumbnail_path?.trim()) continue;
    const paths = covers.get(key) ?? new Set<string>();
    paths.add(block.thumbnail_path);
    covers.set(key, paths);
  }
  let updated = 0;
  let conflicts = 0;
  for (const block of videos) {
    const key = playbackId(block.content);
    const paths = key ? covers.get(key) : undefined;
    if (!paths?.size) continue;
    if (paths.size > 1) { conflicts += 1; continue; }
    const thumbnailPath = [...paths][0];
    if (block.thumbnail_path === thumbnailPath) continue;
    // Recheck the original values so a concurrent admin edit is preserved.
    let update = admin.from("lesson_blocks")
      .update({ thumbnail_path: thumbnailPath, updated_at: new Date().toISOString() })
      .eq("id", block.id).eq("kind", "video").eq("content", block.content);
    update = block.thumbnail_path === null
      ? update.is("thumbnail_path", null)
      : update.eq("thumbnail_path", block.thumbnail_path);
    const { data: changed, error: updateError } = await update.select("id");
    if (updateError) return NextResponse.json({ error: `Обновлено превью: ${updated}. Не удалось завершить. Повторите действие.` }, { status: 500 });
    updated += changed?.length ?? 0;
  }
  return NextResponse.json({ updated, conflicts });
}
