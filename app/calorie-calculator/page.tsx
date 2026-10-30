import { redirect } from "next/navigation";
import CalorieCalculator from "@/components/CalorieCalculator";
import CalculatorHeader from "@/components/CalculatorHeader";
import { getSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function CalorieCalculatorPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: access }, { data: profile }, { data: availableCourses }] = await Promise.all([
    supabase.from("enrollments").select("course:courses(grants_calorie_calculator)").eq("user_id", user.id),
    supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle(),
    supabase.from("courses").select("title,slug").eq("grants_calorie_calculator", true).eq("published", true).order("display_order"),
  ]);
  const allowed = Boolean(profile?.is_admin) || (access ?? []).some((row: any) => row.course?.grants_calorie_calculator);
  const backHref = from && /^[a-z0-9-]+$/i.test(from) ? `/my-programs/${from}` : "/my-programs";
  return <><CalculatorHeader backHref={backHref} /><CalorieCalculator locked={!allowed} availableCourses={availableCourses ?? []} /></>;
}
