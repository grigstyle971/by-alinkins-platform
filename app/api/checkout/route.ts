import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCourse } from "@/lib/courses";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSiteUrl } from "@/lib/site-url";
export async function POST(request: Request) {
  const data = await request.formData();
  const courseSlug = String(data.get("courseSlug"));
  let course = getCourse(courseSlug);
  try {
    const { data: databaseCourse } = await getSupabaseAdmin().from("courses").select("slug,status,stripe_price_id").eq("slug", courseSlug).eq("published", true).maybeSingle();
    if (databaseCourse) course = {
      slug: databaseCourse.slug,
      title: "",
      weeks: 0,
      price: 0,
      stripePriceId: databaseCourse.stripe_price_id ?? "price_REPLACE_ME",
      description: "",
      image: "",
      status: databaseCourse.status === "coming-soon" ? "coming-soon" : "available",
    };
  } catch {
    // Keep static courses working if database access is temporarily unavailable.
  }
  if (!course || course.status !== "available") return NextResponse.json({ error: "Course not available" }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY || course.stripePriceId === "price_REPLACE_ME") return NextResponse.json({ error: "Stripe price is not configured for this course." }, { status: 503 });
  let baseUrl: string;
  try { baseUrl = getSiteUrl(); } catch { return NextResponse.json({ error: "Checkout is temporarily unavailable." }, { status: 503 }); }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({ mode: "payment", customer_creation: "always", line_items: [{ price: course.stripePriceId, quantity: 1 }], success_url: `${baseUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${baseUrl}/courses/${course.slug}?payment=cancelled`, metadata: { course_slug: course.slug } });
  return NextResponse.json({ url: session.url });
}
