import Link from "next/link";
import CourseOverviewHeader from "@/components/CourseOverviewHeader";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type LessonPreview = { id: string; title: string; section: string; kind: "text" | "video" | "finish"; position: number };
const isFinishLesson = (lesson: LessonPreview) => lesson.kind === "finish" || /^(share your results|поделись.*результат)/i.test(lesson.title.trim());

const courseFilesBucket = "course-files";

type CourseCover = { src: string; srcSet?: string };

function courseFilePath(value: string) {
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const marker = `/${courseFilesBucket}/`;
    const index = url.pathname.indexOf(marker);
    return index === -1 ? null : decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

function courseCoverSource(path: string | null | undefined): CourseCover {
  const fallback = "/images/Deep-Core.jpg";
  if (!path) return { src: fallback };
  if ((path.startsWith("/") && !path.includes("/storage/")) || (/^https?:\/\//i.test(path) && !path.includes("/storage/"))) {
    return { src: path };
  }

  const filePath = courseFilePath(path);
  if (!filePath || !/\.(?:avif|jpe?g|png|webp)$/i.test(filePath)) {
    return { src: `/api/course-file?path=${encodeURIComponent(path)}` };
  }

  // Stable URLs let the browser and Vercel edge cache reuse the same private
  // Storage rendition instead of downloading a new signed URL on each visit.
  const imageUrl = (width: 480 | 960 | 1600) =>
    `/api/course-image?path=${encodeURIComponent(filePath)}&width=${width}&v=2`;
  return {
    src: imageUrl(960),
    srcSet: `${imageUrl(480)} 480w, ${imageUrl(960)} 960w, ${imageUrl(1600)} 1600w`,
  };
}

export default async function ProgramOverviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const preview = (await searchParams).preview === "1";
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (preview) await requireAdmin();

  const dataSource = preview ? getSupabaseAdmin() : supabase;
  const { data: course } = await dataSource.from("courses").select("id,title,weeks,description,product_type,image_path,cover_focus_x,cover_focus_y,cover_cabinet_focus_x,cover_cabinet_focus_y,cover_cabinet_zoom,grants_calorie_calculator").eq("slug", slug).single();
  if (!course) notFound();
  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
  if (!preview && !enrollment) redirect("/my-programs");
  const { data: calculatorAccess } = await supabase.from("enrollments").select("course:courses(grants_calorie_calculator)").eq("user_id", user.id);
  const hasCalculatorAccess = preview || (calculatorAccess ?? []).some((row: any) => row.course?.grants_calorie_calculator);

  const admin = getSupabaseAdmin();
  const lessonsQuery = admin.from("lessons").select("id,title,section,kind,position").eq("course_id", course.id);
  if (!preview) lessonsQuery.eq("published", true);
  const { data } = await lessonsQuery.order("position");
  const lessons = (data ?? []) as LessonPreview[];
  const sections = [...new Set(lessons.map((lesson) => lesson.section))];
  const cover = courseCoverSource(course.image_path);
  const learnHref = `/my-programs/${slug}/learn${preview ? "?preview=1" : ""}`;

  return <main className="course-overview">
    <CourseOverviewHeader hasCalculatorAccess={hasCalculatorAccess} calculatorHref={`/calorie-calculator?from=${slug}`} />
    <section className="course-overview-hero">
      <div className="course-overview-cover"><img src={cover.src} srcSet={cover.srcSet} sizes="(max-width: 760px) 100vw, 440px" alt={course.title} loading="eager" fetchPriority="high" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${course.cover_cabinet_focus_x ?? course.cover_focus_x ?? 50}% ${course.cover_cabinet_focus_y ?? course.cover_focus_y ?? 50}%`, transform: `scale(${course.cover_cabinet_zoom ?? 1})`, transformOrigin: `${course.cover_cabinet_focus_x ?? course.cover_focus_x ?? 50}% ${course.cover_cabinet_focus_y ?? course.cover_focus_y ?? 50}%` }} /></div>
      <div className="course-overview-copy"><p className="course-overview-eyebrow">{course.product_type === "guide" ? "DIGITAL GUIDE" : (course.weeks ? `${course.weeks}-WEEK PROGRAM` : "YOUR PROGRAM")}</p><h1>{course.title}</h1><Link className="course-overview-start" href={learnHref} scroll>{course.product_type === "guide" ? "Open guide" : "Start"} <span>→</span></Link></div>
    </section>
    <section className="course-overview-content"><div className="course-overview-sections">{sections.map((section) => <article className="course-overview-section" key={section}><h3>{section}</h3><div>{lessons.filter((lesson) => lesson.section === section).map((lesson) => <Link className="course-overview-lesson" key={lesson.id} href={`/my-programs/${slug}/learn?${preview ? "preview=1&" : ""}lesson=${lesson.id}`}><span className={lesson.kind === "video" ? "course-overview-video" : isFinishLesson(lesson) ? "course-overview-finish" : "course-overview-text"}>{lesson.kind === "video" ? "▶" : isFinishLesson(lesson) ? "finish" : "☰"}</span><span>{lesson.title}</span></Link>)}</div></article>)}</div></section>
  </main>;
}
