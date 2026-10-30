import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function normalize(body: Record<string, unknown>) {
  const clean = (value: unknown) => typeof value === "string" ? value.trim() || null : null;
  const focus = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 50;
  };
  const zoom = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(1, Math.min(3, Math.round(number * 100) / 100)) : 1;
  };
  return {
    title: clean(body.title), slug: clean(body.slug)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, ""),
    description: clean(body.description), sales_story_title: clean(body.sales_story_title), sales_story_body: clean(body.sales_story_body), sales_story_conclusion: clean(body.sales_story_conclusion), sales_gallery_title: clean(body.sales_gallery_title), sales_gallery: Array.isArray(body.sales_gallery) ? body.sales_gallery.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()) : [], guide_preview_gallery: Array.isArray(body.guide_preview_gallery) ? body.guide_preview_gallery.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).map((value: string) => value.trim()) : [], equipment_image_path: clean(body.equipment_image_path), equipment_button_label: clean(body.equipment_button_label), weeks: Number(body.weeks) || null, price: Number(body.price) || null, old_price: Number(body.old_price) || null,
    stripe_price_id: clean(body.stripe_price_id), image_path: clean(body.image_path), product_type: body.product_type === "guide" ? "guide" : "course", cover_focus_x: focus(body.cover_focus_x), cover_focus_y: focus(body.cover_focus_y),
    cover_card_focus_x: focus(body.cover_card_focus_x), cover_card_focus_y: focus(body.cover_card_focus_y),
    cover_sales_focus_x: focus(body.cover_sales_focus_x), cover_sales_focus_y: focus(body.cover_sales_focus_y),
    cover_sales_phone_focus_x: focus(body.cover_sales_phone_focus_x), cover_sales_phone_focus_y: focus(body.cover_sales_phone_focus_y), cover_sales_tablet_focus_x: focus(body.cover_sales_tablet_focus_x), cover_sales_tablet_focus_y: focus(body.cover_sales_tablet_focus_y), cover_sales_desktop_focus_x: focus(body.cover_sales_desktop_focus_x), cover_sales_desktop_focus_y: focus(body.cover_sales_desktop_focus_y),
    cover_cabinet_focus_x: focus(body.cover_cabinet_focus_x), cover_cabinet_focus_y: focus(body.cover_cabinet_focus_y),
    cover_dashboard_focus_x: focus(body.cover_dashboard_focus_x), cover_dashboard_focus_y: focus(body.cover_dashboard_focus_y),
    cover_card_zoom: zoom(body.cover_card_zoom), cover_sales_zoom: zoom(body.cover_sales_zoom), cover_cabinet_zoom: zoom(body.cover_cabinet_zoom), cover_dashboard_zoom: zoom(body.cover_dashboard_zoom),
    cover_sales_phone_zoom: zoom(body.cover_sales_phone_zoom), cover_sales_tablet_zoom: zoom(body.cover_sales_tablet_zoom), cover_sales_desktop_zoom: zoom(body.cover_sales_desktop_zoom),
    status: body.status === "coming-soon" ? "coming-soon" : "available", grants_calorie_calculator: Boolean(body.grants_calorie_calculator), display_order: Math.max(0, Number(body.display_order) || 0), published: Boolean(body.published), updated_at: new Date().toISOString(),
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const update = normalize(body);
  if (!update.title || !update.slug) return NextResponse.json({ error: "Course title and URL slug are required." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("courses").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath(`/courses/${data.slug}`);
  const cover_url = data.image_path
    ? (await getSupabaseAdmin().storage.from("course-files").createSignedUrl(data.image_path, 60 * 60)).data?.signedUrl ?? null
    : null;
  return NextResponse.json({ course: { ...data, cover_url } });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { error } = await getSupabaseAdmin().from("courses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/");
  revalidatePath("/home");
  return NextResponse.json({ ok: true });
}
