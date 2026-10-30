import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data: source, error: sourceError } = await admin
    .from("lessons")
    .select("course_id,title,section,kind,content,video_url,image_path,pdf_path,duration,lesson_blocks(kind,content,thumbnail_path,file_name,position)")
    .eq("id", id)
    .single();
  if (sourceError || !source) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const { data: last } = await admin.from("lessons").select("position").eq("course_id", source.course_id).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data: lesson, error: lessonError } = await admin.from("lessons").insert({
    course_id: source.course_id,
    title: `${source.title} (copy)`,
    section: source.section,
    kind: source.kind,
    content: source.content,
    video_url: source.video_url,
    image_path: source.image_path,
    pdf_path: source.pdf_path,
    duration: source.duration,
    position: (last?.position ?? -1) + 1,
    published: false,
  }).select().single();
  if (lessonError || !lesson) return NextResponse.json({ error: lessonError?.message || "Could not copy lesson." }, { status: 400 });

  const blocks = (source.lesson_blocks ?? []).sort((a, b) => a.position - b.position);
  if (blocks.length) {
    const { data: copiedBlocks, error: blocksError } = await admin.from("lesson_blocks").insert(blocks.map((block) => ({
      lesson_id: lesson.id, kind: block.kind, content: block.content, thumbnail_path: block.thumbnail_path ?? null, file_name: block.file_name ?? null, position: block.position,
    }))).select();
    if (blocksError) {
      await admin.from("lessons").delete().eq("id", lesson.id);
      return NextResponse.json({ error: blocksError.message }, { status: 400 });
    }
    return NextResponse.json({ lesson: { ...lesson, lesson_blocks: copiedBlocks ?? [] } }, { status: 201 });
  }
  return NextResponse.json({ lesson: { ...lesson, lesson_blocks: [] } }, { status: 201 });
}
