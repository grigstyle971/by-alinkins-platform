import { notFound, redirect } from "next/navigation";
import ProgramPlayer from "@/components/ProgramPlayer";
import { getSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { preload } from "react-dom";

export const dynamic = "force-dynamic";

const courseFilesBucket = "course-files";

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

async function courseFileUrl(admin: SupabaseClient, path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("/") && !path.includes("/storage/")) return path;
  if (/^https?:\/\//i.test(path) && !path.includes("/storage/")) return path;
  const filePath = courseFilePath(path);
  if (!filePath) return `/api/course-file?path=${encodeURIComponent(path)}`;
  const isImage = /\.(?:avif|jpe?g|png|webp)$/i.test(filePath);
  if (isImage) {
    return `/api/course-image?path=${encodeURIComponent(filePath)}&width=960&v=2`;
  }
  // The client never receives the source PDF. Its pages are rendered on the
  // authorized server with a personal watermark.
  if (/\.pdf$/i.test(filePath)) return filePath;
  return `/api/course-file?path=${encodeURIComponent(filePath)}`;
}

type CourseImageSource = { src: string; srcSet?: string };

async function courseImageSources(admin: SupabaseClient, path: string | null | undefined): Promise<CourseImageSource | null> {
  if (!path) return null;
  if ((path.startsWith("/") && !path.includes("/storage/")) || (/^https?:\/\//i.test(path) && !path.includes("/storage/"))) {
    return { src: path };
  }

  const filePath = courseFilePath(path);
  if (!filePath || !/\.(?:avif|jpe?g|png|webp)$/i.test(filePath)) {
    const src = await courseFileUrl(admin, path);
    return src ? { src } : null;
  }

  // Unlike a signed Storage URL, this address is stable. Vercel can therefore
  // cache the same photo/banner at the edge after the first request.
  const imageUrl = (width: 480 | 960 | 1600) =>
    `/api/course-image?path=${encodeURIComponent(filePath)}&width=${width}&v=2`;
  return {
    src: imageUrl(960),
    srcSet: `${imageUrl(480)} 480w, ${imageUrl(960)} 960w, ${imageUrl(1600)} 1600w`,
  };
}

export default async function ProgramLessonsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string; lesson?: string }> }) {
  const { slug } = await params;
  const { preview: previewValue, lesson: initialLessonId } = await searchParams;
  const preview = previewValue === "1";
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (preview) await requireAdmin();

  const dataSource = preview ? getSupabaseAdmin() : supabase;
  const { data: course } = await dataSource.from("courses").select("id,title,product_type,grants_calorie_calculator").eq("slug", slug).single();
  if (!course) notFound();

  const { data: enrollment } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
  if (!preview && !enrollment) redirect("/my-programs");
  const { data: calculatorAccess } = await supabase.from("enrollments").select("course:courses(grants_calorie_calculator)").eq("user_id", user.id);
  const hasCalculatorAccess = preview || (calculatorAccess ?? []).some((row: any) => row.course?.grants_calorie_calculator);

  const admin = getSupabaseAdmin();
  const lessonsQuery = admin.from("lessons").select("id,title,section,kind,content,video_url,image_path,pdf_path,duration,position,lesson_blocks(id,kind,content,thumbnail_path,file_name,position)").eq("course_id", course.id);
  if (!preview) lessonsQuery.eq("published", true);
  const { data: lessons } = await lessonsQuery.order("position");
  const playerLessons = await Promise.all((lessons ?? []).map(async (lesson) => {
    const blocks = await Promise.all((lesson.lesson_blocks ?? []).sort((a, b) => a.position - b.position).map(async (block) => {
      const isImage = block.kind === "image" || block.kind === "centered_image" || block.kind === "photo_examples" || block.kind === "week_banner";
      const image = isImage ? await courseImageSources(admin, block.content) : null;
      return {
        ...block,
        content: image?.src ?? (block.kind === "pdf" ? await courseFileUrl(admin, block.content) ?? block.content : block.content),
        image_srcset: image?.srcSet,
        thumbnail_url: await courseFileUrl(admin, block.thumbnail_path),
      };
    }));
    const image = await courseImageSources(admin, lesson.image_path);
    return { ...lesson, blocks, image_url: image?.src ?? null, image_srcset: image?.srcSet, pdf_url: await courseFileUrl(admin, lesson.pdf_path) };
  }));

  // Put the first visible lesson image in the document head. This starts its
  // request while the browser is still parsing the page instead of waiting
  // for the client player to hydrate.
  const requestedLesson = initialLessonId ? playerLessons.find((lesson) => lesson.id === initialLessonId) : null;
  const initialLesson = requestedLesson ?? playerLessons[0];
  const initialImageBlock = initialLesson?.blocks.find((block) => block.kind === "week_banner" || block.kind === "image" || block.kind === "centered_image" || block.kind === "photo_examples");
  const initialImage = initialImageBlock
    ? { src: initialImageBlock.content, srcSet: initialImageBlock.image_srcset }
    : initialLesson?.image_url
      ? { src: initialLesson.image_url, srcSet: initialLesson.image_srcset }
      : null;
  if (initialImage?.src) {
    preload(initialImage.src, {
      as: "image",
      imageSrcSet: initialImage.srcSet ?? undefined,
      imageSizes: "(max-width: 600px) 100vw, 760px",
      fetchPriority: "high",
    });
  }

  return <ProgramPlayer courseTitle={course.title} courseSlug={slug} initialLessonId={initialLessonId} lessons={playerLessons} hasCalculatorAccess={hasCalculatorAccess} isGuide={course.product_type === "guide"} />;
}
