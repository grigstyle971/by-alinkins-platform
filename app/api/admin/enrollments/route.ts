import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createAccountSetupCode } from "@/lib/account-setup-code";

export async function POST(request: Request) {
  if (!(await isRequestAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  if (!email || !courseId) return NextResponse.json({ error: "Укажите e-mail и курс." }, { status: 400 });

  const admin = getSupabaseAdmin();
  const [{ data: course }, { data: users, error: usersError }] = await Promise.all([
    admin.from("courses").select("id,title").eq("id", courseId).maybeSingle(),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (!course) return NextResponse.json({ error: "Курс не найден." }, { status: 404 });
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 });

  let user = users.users.find((item) => item.email?.toLowerCase() === email);
  let invited = false;
  if (!user) {
    try {
      user = await createAccountSetupCode(email);
    } catch {
      return NextResponse.json({ error: "Не удалось отправить код для создания аккаунта." }, { status: 503 });
    }
    invited = true;
  } else if (!user.email_confirmed_at) {
    try {
      await createAccountSetupCode(email, "recovery");
    } catch {
      return NextResponse.json({ error: "Не удалось отправить код для создания аккаунта." }, { status: 503 });
    }
    invited = true;
  }

  const { data: existing, error: existingError } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });
  if (existing) return NextResponse.json({ alreadyGranted: true, message: "У этого пользователя уже есть доступ к курсу." });

  const { error } = await admin.from("enrollments").insert({
    user_id: user.id,
    course_id: courseId,
    // Manual access shares the existing enrollment flow without imitating a Stripe payment.
    stripe_checkout_session_id: `manual:${courseId}:${user.id}`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ granted: true, message: invited ? `Доступ к курсу «${course.title}» выдан. Пользователю отправлен 8-значный код для создания пароля.` : `Доступ к курсу «${course.title}» выдан.` });
}
