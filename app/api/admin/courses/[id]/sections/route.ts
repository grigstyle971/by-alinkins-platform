import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: course_id } = await params;
  const body = await request.json();
  const title = clean(body.title);
  if (!title) return NextResponse.json({ error: "Section title is required." }, { status: 400 });
  const { data: last } = await getSupabaseAdmin().from("course_sections").select("position").eq("course_id", course_id).order("position", { ascending: false }).limit(1);
  const { data, error } = await getSupabaseAdmin().from("course_sections").insert({
    course_id, title, content: clean(body.content), position: Number.isFinite(Number(body.position)) ? Math.max(0, Number(body.position)) : ((last?.[0]?.position ?? -1) + 1),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ section: data }, { status: 201 });
}
