import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowed = new Set(["text", "heading", "callout", "checklist", "quote", "label", "image", "centered_image", "photo_examples", "week_banner", "video", "pdf", "separator"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: lesson_id } = await params;
  const body = await request.json();
  const kind = typeof body.kind === "string" && allowed.has(body.kind) ? body.kind : "text";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const thumbnail_path = typeof body.thumbnail_path === "string" && body.thumbnail_path.trim() ? body.thumbnail_path.trim() : null;
  const file_name = typeof body.file_name === "string" && body.file_name.trim() ? body.file_name.trim() : null;
  if (!content && kind !== "separator") return NextResponse.json({ error: "Add content or upload a file first." }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { data: last } = await admin.from("lesson_blocks").select("position").eq("lesson_id", lesson_id).order("position", { ascending: false }).limit(1).maybeSingle();
  const position = typeof body.position === "number" ? Math.max(0, body.position) : (last?.position ?? -1) + 1;
  // Insert in the middle without making the editor renumber every following block.
  const { data: following, error: followingError } = await admin.from("lesson_blocks").select("id,position").eq("lesson_id", lesson_id).gte("position", position).order("position", { ascending: false });
  if (followingError) return NextResponse.json({ error: followingError.message }, { status: 400 });
  for (const block of following ?? []) {
    const { error } = await admin.from("lesson_blocks").update({ position: block.position + 1, updated_at: new Date().toISOString() }).eq("id", block.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const { data, error } = await admin.from("lesson_blocks").insert({ lesson_id, kind, content, thumbnail_path: kind === "video" ? thumbnail_path : null, file_name: kind === "pdf" ? file_name : null, position }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ block: data }, { status: 201 });
}
