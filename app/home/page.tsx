import { Storefront } from "../page";
import type { Metadata } from "next";
import { courses, type Course } from "@/lib/courses";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import type { Review, Transformation } from "@/components/ResultsAndReviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Workout programs | by.alinkins",
  description: "Explore focused home workout programs created by Alina.",
  alternates: { canonical: "/home" },
  openGraph: {
    title: "Workout programs | by.alinkins",
    description: "Explore focused home workout programs created by Alina.",
    url: "/home",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "by.alinkins workout programs" }],
  },
  twitter: {
    title: "Workout programs | by.alinkins",
    description: "Explore focused home workout programs created by Alina.",
    images: ["/opengraph-image"],
  },
};

export default async function FullWebsitePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const preview = (await searchParams).preview === "1";
  if (preview) await requireAdmin();
  let data: Array<{ slug: string; title: string; weeks: number | null; price: number | null; stripe_price_id: string | null; description: string | null; image_path: string | null; cover_focus_x: number | null; cover_focus_y: number | null; cover_card_focus_x: number | null; cover_card_focus_y: number | null; cover_card_zoom: number | null; status: string | null; product_type: string | null }> = [];
  let storage: ReturnType<typeof getSupabaseAdmin> | null = null;
  let resultsData: Array<{ id: string; image_path: string; caption: string | null }> = [];
  let reviewsData: Array<{ id: string; author: string; body: string }> = [];
  try {
    storage = getSupabaseAdmin();
    const [result, resultsResponse, reviewsResponse] = await Promise.all([
      preview ? storage.from("courses").select("slug,title,weeks,price,stripe_price_id,description,image_path,cover_focus_x,cover_focus_y,cover_card_focus_x,cover_card_focus_y,cover_card_zoom,status,product_type").order("display_order") : storage.from("courses").select("slug,title,weeks,price,stripe_price_id,description,image_path,cover_focus_x,cover_focus_y,cover_card_focus_x,cover_card_focus_y,cover_card_zoom,status,product_type").eq("published", true).order("display_order"),
      preview ? storage.from("site_results").select("id,image_path,caption").order("position") : storage.from("site_results").select("id,image_path,caption").eq("published", true).order("position"),
      preview ? storage.from("site_reviews").select("id,author,body").order("position") : storage.from("site_reviews").select("id,author,body").eq("published", true).order("position"),
    ]);
    data = result.data ?? [];
    resultsData = resultsResponse.data ?? [];
    reviewsData = reviewsResponse.data ?? [];
  } catch {
    // The local visual preview can run without Supabase variables.
  }
  const courseList: Course[] = await Promise.all((data ?? []).map(async (course) => {
    const fallback = courses.find((item) => item.slug === course.slug);
    let image = fallback?.image || "/images/Deep-Core.jpg";

    if (course.image_path) {
      if (course.image_path.startsWith("/") || /^https?:\/\//i.test(course.image_path)) {
        image = course.image_path;
      } else {
        // A signed URL changes on each page request, which prevents the browser
        // and Vercel edge from reusing an already downloaded public cover.
        image = `/api/course-image?path=${encodeURIComponent(course.image_path)}&original=1&v=5`;
      }
    }
    return {
      slug: course.slug,
      title: course.title,
      weeks: course.weeks ?? 0,
      price: Number(course.price ?? 0),
      stripePriceId: course.stripe_price_id ?? "",
      description: course.description ?? "",
      image,
      imagePosition: `${course.cover_card_focus_x ?? course.cover_focus_x ?? 50}% ${course.cover_card_focus_y ?? course.cover_focus_y ?? 50}%`,
      imageZoom: Number(course.cover_card_zoom ?? 1),
      status: course.status === "coming-soon" ? "coming-soon" : "available",
      productType: course.product_type === "guide" ? "guide" : "course",
    };
  }));
  const transformations: Transformation[] = await Promise.all(resultsData.map(async (item) => {
    let image = item.image_path;
    if (!image.startsWith("/") && !/^https?:\/\//i.test(image)) {
      image = `/api/course-image?path=${encodeURIComponent(image)}&width=1600&v=4`;
    }
    return { id: item.id, image, caption: item.caption };
  }));
  const reviews: Review[] = reviewsData.map((item) => ({ id: item.id, name: item.author, text: item.body }));
  const publishedCourses = courseList.filter((item) => item.productType !== "guide");
  const publishedGuides = courseList.filter((item) => item.productType === "guide");
  return <Storefront showHero={false} courseList={publishedCourses.length ? publishedCourses : (publishedGuides.length ? [] : courses)} guideList={publishedGuides} transformations={transformations.filter((item) => item.image)} reviews={reviews} />;
}
