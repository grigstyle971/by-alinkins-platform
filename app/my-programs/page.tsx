import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import PwaContentRefresh from "@/components/PwaContentRefresh";
import PwaInstallHint from "@/components/PwaInstallHint";

export const dynamic = "force-dynamic";

type CourseRow = { id: string; slug: string; title: string; weeks: number | null; description: string | null; product_type: "course" | "guide" | null; status: "available" | "coming-soon" | null; image_path: string | null; updated_at: string | null; cover_focus_x: number | null; cover_focus_y: number | null; cover_dashboard_focus_x: number | null; cover_dashboard_focus_y: number | null; cover_dashboard_zoom: number | null };
type CourseCard = CourseRow & { coverUrl: string; coverSrcSet?: string };

function withCover(course: CourseRow): CourseCard {
  const fallback = course.slug === "deep-core" ? "/images/Deep-Core.jpg" : "/images/hourglass-hero.jpg";
  if (!course.image_path || course.image_path.startsWith("/") || /^https?:\/\//i.test(course.image_path)) return { ...course, coverUrl: course.image_path || fallback };
  const path = encodeURIComponent(course.image_path);
  const version = encodeURIComponent(course.updated_at ?? "3");
  const url = (width: 480 | 960 | 1600) => `/api/course-image?path=${path}&width=${width}&v=${version}`;
  return { ...course, coverUrl: url(960), coverSrcSet: `${url(480)} 480w, ${url(960)} 960w, ${url(1600)} 1600w` };
}
function ProgramCard({ course, locked = false }: { course: CourseCard; locked?: boolean }) {
  const focusX = course.cover_dashboard_focus_x ?? course.cover_focus_x ?? 50;
  const focusY = course.cover_dashboard_focus_y ?? course.cover_focus_y ?? 50;
  const guide = course.product_type === "guide";
  const action = locked ? (course.status === "coming-soon" ? <span className="button dark">COMING SOON</span> : <Link className="button dark" href={`/courses/${course.slug}`}>BUY</Link>) : <Link className="button dark" href={`/my-programs/${course.slug}`}>{guide ? "OPEN GUIDE" : "OPEN PROGRAM"}</Link>;
  return <article className={`owned-course${locked ? " locked-course" : ""}`}><div className="owned-course-content"><div className="owned-course-cover"><img src={course.coverUrl} srcSet={course.coverSrcSet} sizes="(max-width: 760px) 240px, 320px" alt="" loading="eager" decoding="async" style={{ objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${course.cover_dashboard_zoom ?? 1})`, transformOrigin: `${focusX}% ${focusY}%` }} /></div><div className="owned-course-copy"><p className="eyebrow">{guide ? "DIGITAL GUIDE" : `${course.weeks ?? ""}-WEEK PROGRAM`}</p><h2>{course.title}</h2><p>{course.description}</p>{action}</div></div></article>;
}
export default async function MyPrograms() {
  const supabase = await getSupabaseServer(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const fields = "id,slug,title,weeks,description,product_type,status,image_path,updated_at,cover_focus_x,cover_focus_y,cover_dashboard_focus_x,cover_dashboard_focus_y,cover_dashboard_zoom";
  const [{ data: enrollmentRows }, { data: allCourseRows }] = await Promise.all([supabase.from("enrollments").select(`course:courses(${fields})`).eq("user_id", user.id).order("created_at", { ascending: false }), supabase.from("courses").select(fields).eq("published", true).order("display_order", { ascending: true })]);
  const programs = ((enrollmentRows ?? []).map((row) => row.course).filter(Boolean) as unknown as CourseRow[]).map(withCover);
  const ownedIds = new Set(programs.map((course) => course.id)); const lockedPrograms = ((allCourseRows ?? []) as CourseRow[]).filter((course) => !ownedIds.has(course.id)).map(withCover);
  return <main className="dashboard"><PwaContentRefresh /><header className="nav dashboard-nav"><Link href="/home#workout-programs" className="logo">by.alinkins</Link><nav><form action="/auth/signout" method="POST"><button className="text-button">Sign out</button></form></nav></header><section><p className="eyebrow">YOUR SPACE</p><h1>My programs</h1><p className="muted">Signed in as {user.email}</p><PwaInstallHint />{programs.length > 0 && <div className="owned-grid">{programs.map((course) => <ProgramCard key={course.id} course={course} />)}</div>}{lockedPrograms.length > 0 && <section className="locked-programs"><p className="eyebrow">EXPLORE MORE PROGRAMS</p><div className="owned-grid">{lockedPrograms.map((course) => <ProgramCard key={course.id} course={course} locked />)}</div></section>}{!programs.length && !lockedPrograms.length && <div className="empty-state"><h2>You have no programs yet</h2><p>Once you purchase a program or guide, it will appear here automatically.</p><Link className="button dark" href="/home#workout-programs">EXPLORE PROGRAMS</Link></div>}</section></main>;
}
