import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createAccountSetupCode } from "@/lib/account-setup-code";
export const runtime = "nodejs";

async function findUserByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  throw new Error("User lookup limit reached.");
}

async function fulfillCheckout(session: Stripe.Checkout.Session, stripe: Stripe) {
  // A completed Checkout can still be unpaid for delayed payment methods.
  if (session.payment_status !== "paid") return;

  const slug = session.metadata?.course_slug;
  const email = session.customer_details?.email?.trim().toLowerCase();
  if (!slug || !email) throw new Error("Missing course or customer email.");

  const admin = getSupabaseAdmin();
  const { data: course, error: courseError } = await admin.from("courses").select("id").eq("slug", slug).single();
  if (courseError || !course) throw new Error("Course not found.");

  let user = await findUserByEmail(admin, email);
  // An account left in "Waiting for verification" has no usable password yet.
  // It needs a code just like a brand-new checkout, unlike an active customer.
  const accountSetupRequired = !user || !user.email_confirmed_at;
  if (!user) {
    user = await createAccountSetupCode(email);
  } else if (accountSetupRequired) {
    await createAccountSetupCode(email, "recovery");
  }

  // The purchase-success page reads this safe boolean from the paid Stripe
  // session. Existing customers keep their password and receive no email.
  await stripe.checkout.sessions.update(session.id, {
    metadata: { ...session.metadata, account_setup_required: accountSetupRequired ? "true" : "false" },
  });

  const { error } = await admin.from("enrollments").upsert(
    { user_id: user.id, course_id: course.id, stripe_checkout_session_id: session.id },
    { onConflict: "stripe_checkout_session_id" },
  );
  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature"); if (!signature || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhook is not configured" }, { status: 400 });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); let event: Stripe.Event; try { event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_WEBHOOK_SECRET); } catch { return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    try {
      await fulfillCheckout(event.data.object as Stripe.Checkout.Session, stripe);
    } catch {
      // A non-2xx response makes Stripe retry, rather than silently losing access.
      return NextResponse.json({ error: "Could not process payment." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
