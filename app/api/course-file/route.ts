import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseServer } from "@/lib/supabase-server";

const bucket = "course-files";

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

  const value = new URL(request.url).searchParams.get("path");
  const path = value ? storagePath(value) : null;
  if (!path || path.includes("..")) return NextResponse.json({ error: "Invalid file path" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const [lessonImages, lessonPdfs, blockContent, blockThumbnails] = await Promise.all([
    admin.from("lessons").select("course_id").eq("image_path", path),
    admin.from("lessons").select("course_id").eq("pdf_path", path),
    admin.from("lesson_blocks").select("lesson_id").eq("content", path),
    admin.from("lesson_blocks").select("lesson_id").eq("thumbnail_path", path),
  ]);
  const blockLessonIds = [...(blockContent.data ?? []), ...(blockThumbnails.data ?? [])].map((block) => block.lesson_id);
  const { data: blockLessons } = blockLessonIds.length
    ? await admin.from("lessons").select("course_id").in("id", blockLessonIds)
    : { data: [] as { course_id: string }[] };
  const courseIds = [...new Set([
    ...(lessonImages.data ?? []).map((lesson) => lesson.course_id),
    ...(lessonPdfs.data ?? []).map((lesson) => lesson.course_id),
    ...(blockLessons ?? []).map((lesson) => lesson.course_id),
  ])];
  // Uploaded files are accessible only when they are attached to a course.
  if (!courseIds.length) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .in("course_id", courseIds)
      .maybeSingle();
    if (!enrollment) return NextResponse.json({ error: "Course access required" }, { status: 403 });
  }

  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error || !data) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const filename = path.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || "course-file";
  const isPdf = /\.pdf$/i.test(path);
  return new Response(data, {
    headers: {
      "Content-Type": isPdf ? "application/pdf" : (data.type || "application/octet-stream"),
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(data.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
