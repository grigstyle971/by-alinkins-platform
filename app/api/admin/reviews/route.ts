import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const position = (value: unknown) => Math.max(0, Number(value) || 0);

export async function POST(request: Request) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json(); const author = text(body.author); const content = text(body.body);
  if (!author || !content) return NextResponse.json({ error: "Author and review text are required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("site_reviews").insert({ author, body: content, position: position(body.position), published: Boolean(body.published) }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/home"); revalidatePath("/ru/home");
  return NextResponse.json({ review: data }, { status: 201 });
}
