import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const position = (value: unknown) => Math.max(0, Number(value) || 0);
const refresh = () => { revalidatePath("/home"); revalidatePath("/ru/home"); };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const body = await request.json(); const author = text(body.author); const content = text(body.body);
  if (!author || !content) return NextResponse.json({ error: "Author and review text are required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("site_reviews").update({ author, body: content, position: position(body.position), published: Boolean(body.published) }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refresh(); return NextResponse.json({ review: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("site_reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  refresh(); return NextResponse.json({ ok: true });
}
