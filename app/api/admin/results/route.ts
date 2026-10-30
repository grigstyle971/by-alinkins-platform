import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const position = (value: unknown) => Math.max(0, Number(value) || 0);

export async function POST(request: Request) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const image_path = text(body.image_path);
  if (!image_path) return NextResponse.json({ error: "Upload a before / after image first." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("site_results").insert({
    image_path, caption: text(body.caption) || null, position: position(body.position), published: Boolean(body.published),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/home"); revalidatePath("/ru/home");
  return NextResponse.json({ result: data }, { status: 201 });
}
