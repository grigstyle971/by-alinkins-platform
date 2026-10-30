import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function focus(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 50;
}

function zoom(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(1, Math.min(3, Math.round(number * 100) / 100)) : 1;
}

export async function GET() {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await getSupabaseAdmin()
    .from("courses")
    .select("*, lessons(*, lesson_blocks(*)), course_sections(*)")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const courses = await Promise.all((data ?? []).map(async (course) => {
    if (!course.image_path) return { ...course, cover_url: null };
    const { data: signed } = await getSupabaseAdmin().storage.from("course-files").createSignedUrl(course.image_path, 60 * 60);
    return { ...course, cover_url: signed?.signedUrl ?? null };
  }));
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const title = text(body.title);
  const slug = text(body.slug).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (!title || !slug) return NextResponse.json({ error: "Course title and URL slug are required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("courses").insert({
    title,
    slug,
    description: text(body.description) || null,
    sales_story_title: text(body.sales_story_title) || null,
    sales_story_body: text(body.sales_story_body) || null,
    sales_story_conclusion: text(body.sales_story_conclusion) || null, sales_gallery_title: text(body.sales_gallery_title) || null,
    sales_gallery: Array.isArray(body.sales_gallery) ? body.sales_gallery.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()) : [],
    guide_preview_gallery: Array.isArray(body.guide_preview_gallery) ? body.guide_preview_gallery.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()) : [],
    equipment_image_path: text(body.equipment_image_path) || null,
    equipment_button_label: text(body.equipment_button_label) || null,
    weeks: Number(body.weeks) || null,
    price: Number(body.price) || null,
    old_price: Number(body.old_price) || null,
    stripe_price_id: text(body.stripe_price_id) || null,
    image_path: text(body.image_path) || null,
    product_type: body.product_type === "guide" ? "guide" : "course",
    cover_focus_x: focus(body.cover_focus_x),
    cover_focus_y: focus(body.cover_focus_y),
    cover_card_focus_x: focus(body.cover_card_focus_x),
    cover_card_focus_y: focus(body.cover_card_focus_y),
    cover_sales_focus_x: focus(body.cover_sales_focus_x),
    cover_sales_focus_y: focus(body.cover_sales_focus_y),
    cover_sales_phone_focus_x: focus(body.cover_sales_phone_focus_x), cover_sales_phone_focus_y: focus(body.cover_sales_phone_focus_y),
    cover_sales_tablet_focus_x: focus(body.cover_sales_tablet_focus_x), cover_sales_tablet_focus_y: focus(body.cover_sales_tablet_focus_y),
    cover_sales_desktop_focus_x: focus(body.cover_sales_desktop_focus_x), cover_sales_desktop_focus_y: focus(body.cover_sales_desktop_focus_y),
    cover_cabinet_focus_x: focus(body.cover_cabinet_focus_x),
    cover_cabinet_focus_y: focus(body.cover_cabinet_focus_y),
    cover_dashboard_focus_x: focus(body.cover_dashboard_focus_x),
    cover_dashboard_focus_y: focus(body.cover_dashboard_focus_y),
    cover_card_zoom: zoom(body.cover_card_zoom),
    cover_sales_zoom: zoom(body.cover_sales_zoom),
    cover_sales_phone_zoom: zoom(body.cover_sales_phone_zoom), cover_sales_tablet_zoom: zoom(body.cover_sales_tablet_zoom), cover_sales_desktop_zoom: zoom(body.cover_sales_desktop_zoom),
    cover_cabinet_zoom: zoom(body.cover_cabinet_zoom),
    cover_dashboard_zoom: zoom(body.cover_dashboard_zoom),
    status: body.status === "coming-soon" ? "coming-soon" : "available",
    grants_calorie_calculator: Boolean(body.grants_calorie_calculator),
    display_order: Math.max(0, Number(body.display_order) || 0),
    published: Boolean(body.published),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath(`/courses/${data.slug}`);
  const cover_url = data.image_path
    ? (await getSupabaseAdmin().storage.from("course-files").createSignedUrl(data.image_path, 60 * 60)).data?.signedUrl ?? null
    : null;
  return NextResponse.json({ course: { ...data, cover_url } }, { status: 201 });
}
