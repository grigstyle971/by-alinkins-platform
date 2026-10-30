import AdminStudio from "@/components/AdminStudio";
import type { AdminResult, AdminReview } from "@/components/SiteContentEditor";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  // Older course rows were created before `created_at` existed. Sort by the
  // stable slug instead so both the original Hourglass course and new admin
  // courses always appear in the studio.
  const { data: courses } = await getSupabaseAdmin().from("courses").select("*, lessons(*, lesson_blocks(*)), course_sections(*) ").order("display_order", { ascending: true });
  const sorted = await Promise.all((courses ?? []).map(async (course) => {
    const cover_url = course.image_path
      ? (await getSupabaseAdmin().storage.from("course-files").createSignedUrl(course.image_path, 60 * 60)).data?.signedUrl ?? null
      : null;
    return { ...course, cover_url, lessons: [...(course.lessons ?? [])].sort((a, b) => a.position - b.position).map((lesson) => ({ ...lesson, lesson_blocks: [...(lesson.lesson_blocks ?? [])].sort((a, b) => a.position - b.position) })), course_sections: [...(course.course_sections ?? [])].sort((a, b) => a.position - b.position) };
  }));
  let results: AdminResult[] = [];
  let reviews: AdminReview[] = [];
  try {
    const [resultsResponse, reviewsResponse] = await Promise.all([
      getSupabaseAdmin().from("site_results").select("*").order("position"),
      getSupabaseAdmin().from("site_reviews").select("*").order("position"),
    ]);
    results = await Promise.all((resultsResponse.data ?? []).map(async (item) => {
      const { data: signed } = await getSupabaseAdmin().storage.from("course-files").createSignedUrl(item.image_path, 60 * 60);
      return { ...item, image_url: signed?.signedUrl ?? null };
    }));
    reviews = reviewsResponse.data ?? [];
  } catch {
    // The tables are created by supabase/results-and-reviews-migration.sql.
  }
  return <AdminStudio initialCourses={sorted} initialResults={results} initialReviews={reviews} />;
}
