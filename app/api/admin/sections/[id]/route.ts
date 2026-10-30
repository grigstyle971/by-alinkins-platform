import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const title = clean(body.title);
  if (!title) return NextResponse.json({ error: "Section title is required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("course_sections").update({ title, content: clean(body.content), position: Math.max(0, Number(body.position) || 0), updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ section: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("course_sections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
