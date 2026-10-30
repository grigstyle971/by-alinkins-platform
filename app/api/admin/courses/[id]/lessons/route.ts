import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: course_id } = await params;
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Lesson title is required." }, { status: 400 });
  const { data: last } = await getSupabaseAdmin().from("lessons").select("position").eq("course_id", course_id).order("position", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await getSupabaseAdmin().from("lessons").insert({
    course_id, title, section: typeof body.section === "string" && body.section.trim() ? body.section.trim() : "The Basics",
    kind: ["text", "video", "finish"].includes(body.kind) ? body.kind : "text", content: typeof body.content === "string" ? body.content : null,
    video_url: typeof body.video_url === "string" ? body.video_url.trim() || null : null,
    image_path: typeof body.image_path === "string" ? body.image_path.trim() || null : null,
    pdf_path: typeof body.pdf_path === "string" ? body.pdf_path.trim() || null : null,
    duration: typeof body.duration === "string" ? body.duration.trim() || null : null,
    position: typeof body.position === "number" ? body.position : (last?.position ?? -1) + 1,
    published: Boolean(body.published),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ lesson: data }, { status: 201 });
}
