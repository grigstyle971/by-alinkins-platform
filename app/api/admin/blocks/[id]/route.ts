import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowed = new Set(["text", "heading", "callout", "checklist", "quote", "label", "image", "centered_image", "photo_examples", "week_banner", "video", "pdf", "separator"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const body = await request.json();
  const kind = typeof body.kind === "string" && allowed.has(body.kind) ? body.kind : "text";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const thumbnail_path = typeof body.thumbnail_path === "string" && body.thumbnail_path.trim() ? body.thumbnail_path.trim() : null;
  const file_name = typeof body.file_name === "string" && body.file_name.trim() ? body.file_name.trim() : null;
  if (!content && kind !== "separator") return NextResponse.json({ error: "Block content is required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("lesson_blocks").update({ kind, content, thumbnail_path: kind === "video" ? thumbnail_path : null, file_name: kind === "pdf" ? file_name : null, position: Number(body.position) || 0, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ block: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("lesson_blocks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
