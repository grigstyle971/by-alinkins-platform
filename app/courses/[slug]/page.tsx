import Link from "next/link";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import SiteHeader from "@/components/SiteHeader";
import CheckoutButton from "@/components/CheckoutButton";
import EquipmentListButton from "@/components/EquipmentListButton";
import PhotoMarquee from "@/components/PhotoMarquee";
import GuidePreviewCarousel from "@/components/GuidePreviewCarousel";

export const dynamic = "force-dynamic";

type DatabaseCourse = {
  id: string;
  slug: string;
  title: string;
  weeks: number | null;
  price: number | null;
  old_price: number | null;
  stripe_price_id: string | null;
  description: string | null;
  sales_story_title: string | null;
  sales_story_body: string | null;
  sales_story_conclusion: string | null;
  sales_gallery: string[] | null;
  sales_gallery_title: string | null;
  guide_preview_gallery: string[] | null;
  equipment_image_path: string | null;
  equipment_button_label: string | null;
  image_path: string | null;
  cover_focus_x: number | null;
  cover_focus_y: number | null;
  cover_sales_focus_x: number | null;
  cover_sales_focus_y: number | null;
  cover_sales_zoom: number | null;
  cover_sales_phone_focus_x?: number | null;
  cover_sales_phone_focus_y?: number | null;
  cover_sales_tablet_focus_x?: number | null;
  cover_sales_tablet_focus_y?: number | null;
  cover_sales_desktop_focus_x?: number | null;
  cover_sales_desktop_focus_y?: number | null;
  cover_sales_phone_zoom?: number | null;
  cover_sales_tablet_zoom?: number | null;
  cover_sales_desktop_zoom?: number | null;
  product_type: "course" | "guide" | null;
};

type CourseSection = {
  id: string;
  title: string;
  content: string;
  position: number;
};

const nav = ["About me", "Workout programs", "Transformation results", "FAQ"] as const;
const ids = ["about-me", "workout-programs", "transformation-results", "faq"] as const;
const faqItems = [
  ["How long will I have access to the program?", "You get lifetime access to the training program."],
  ["How do I access the program?", "After purchase, you’ll receive your login details by email. All course materials are available in your personal account immediately after you log in."],
  ["Does the program include form checks?", "The program is designed for independent training, so personal form feedback is not included."],
  ["What is your refund policy?", "Refunds are not available for digital programs because access is granted automatically immediately after purchase."],
  ["What payment methods are available?", "Visa, Mastercard, Apple Pay, and Google Pay are available at checkout."],
  ["Will I receive a receipt after purchase?", "Yes. A payment receipt will be sent to your email after the transaction is completed."],
  ["What language are the programs available in?", "The programs are fully available in English."],
] as const;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alinkinscodex.vercel.app";
function RichSectionText({ text }: { text: string }) { return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") && part.endsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part.split("\n").map((line, lineIndex) => <span key={`${index}-${lineIndex}`}>{lineIndex > 0 && <br />}{line}</span>))}</>; }

function courseImageUrl(imagePath: string | null) {
  if (!imagePath) return undefined;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) return new URL(imagePath, siteUrl).toString();
  return new URL(`/api/course-image?path=${encodeURIComponent(imagePath)}&original=1&v=5`, siteUrl).toString();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data: course } = await getSupabaseAdmin()
      .from("courses")
      .select("slug,title,description,image_path")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!course) return {};

    const title = `${course.title} | by.alinkins`;
    const description = (course.description || "A focused home workout program by Alina.").replace(/\s+/g, " ").trim().slice(0, 160);
    const image = courseImageUrl(course.image_path);
    return {
      title,
      description,
      alternates: { canonical: `/courses/${course.slug}` },
      openGraph: { title, description, url: `/courses/${course.slug}`, images: image ? [{ url: image, alt: course.title }] : [] },
      twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
    };
  } catch {
    return {};
  }
}

export default async function DynamicCoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";
  if (isPreview) await requireAdmin();
  let course: DatabaseCourse | null = null;
  let image = "/images/Deep-Core.jpg";
  let sections: CourseSection[] = [];

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("courses")
      .select("*")
      .eq("slug", slug);
    if (!isPreview) query = query.eq("published", true);
    const result = await query.maybeSingle();

    course = result.data;

    if (course) {
      const sectionResult = await supabase
        .from("course_sections")
        .select("id,title,content,position")
        .eq("course_id", course.id)
        .order("position");

      if (!sectionResult.error) sections = sectionResult.data ?? [];
    }

    if (course?.image_path) {
      if (course.image_path.startsWith("/") || /^https?:\/\//i.test(course.image_path)) {
        image = course.image_path;
      } else {
        // A stable, resized URL is cached at the edge. Signed Storage URLs make
        // every course visit a cache miss and were the source of the gray hero.
        image = `/api/course-image?path=${encodeURIComponent(course.image_path)}&original=1&v=5`;
      }
    }
  } catch {
    // A database course cannot be shown without Supabase configuration.
  }

  if (!course) notFound();

  const hasPayment = Boolean(course.stripe_price_id && course.stripe_price_id !== "price_REPLACE_ME");
  const price = Number(course.price ?? 0);
  const oldPrice = Number(course.old_price ?? 0);
  const hasDiscount = hasPayment && oldPrice > price;
  const mobileImage = image.replace(/([?&]width=)2400\b/, (_, prefix) => `${prefix}1600`);

  return (
    <main className="course-sales-page">
      <style>{`
        .course-sales-page { min-height:100vh; background:#fff; color:#080808; font-family:var(--font-hanken-grotesk),Arial,sans-serif; font-weight:300; }
 .course-sales-page .course-sales-hero { position:relative; width:100%; max-width:none; height:calc(100svh - 80px); margin:0; overflow:hidden; color:#fff; }
        .course-sales-page .course-sales-hero { background:#292929; }
        .course-sales-page .course-sales-photo-frame { position:absolute; inset:0; overflow:hidden; }
        /* A sales cover must preserve the full uploaded photograph. The neutral
           background fills any space instead of cutting off its left/right edges. */
        .course-sales-page .course-sales-photo-frame > img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; object-position:var(--sales-phone-x) var(--sales-phone-y); transform:scale(var(--sales-phone-zoom)); transform-origin:var(--sales-phone-x) var(--sales-phone-y); }
        @media (min-width:601px) { .course-sales-page .course-sales-photo-frame { top:0; bottom:0; left:50%; right:auto; width:auto; height:100%; aspect-ratio:2116 / 2645; transform:translateX(-50%) scale(var(--sales-tablet-zoom)); transform-origin:var(--sales-tablet-x) var(--sales-tablet-y); } .course-sales-page .course-sales-photo-frame > img { object-position:var(--sales-tablet-x) var(--sales-tablet-y); transform:none; } }
        @media (min-width:901px) { .course-sales-page .course-sales-photo-frame { transform:translateX(-50%) scale(var(--sales-desktop-zoom)); transform-origin:var(--sales-desktop-x) var(--sales-desktop-y); } .course-sales-page .course-sales-photo-frame > img { object-position:var(--sales-desktop-x) var(--sales-desktop-y); } }
        .course-sales-page .hero-shade { position:absolute; inset:0; background:rgba(0,0,0,.43); }
        .course-sales-page .hero-heading { position:absolute; z-index:1; top:46px; left:24px; right:24px; text-align:center; }
        .course-sales-page .hero-heading p { margin:0 0 10px; font-family:var(--font-hanken-grotesk),Arial,sans-serif; font-size:14px; font-weight:300; }
        .course-sales-page .hero-heading h1 { margin:0; font-family:var(--font-montserrat),Arial,sans-serif; font-size:clamp(34px,2.8vw,44px); font-weight:600; line-height:1; letter-spacing:.015em; }
        .course-sales-page .hero-purchase { position:absolute; z-index:1; bottom:42px; left:24px; right:24px; display:grid; justify-items:center; gap:9px; text-align:center; }
        .course-sales-page .hero-purchase form,.course-sales-page .hero-checkout { width:min(100%, 260px); }
        .course-sales-page .hero-purchase button { width:100%; min-height:46px; border:0; border-radius:8px; background:#fff; color:#080808; font-family:var(--font-montserrat),Arial,sans-serif; font-size:13px; font-weight:600; cursor:pointer; }
        .course-sales-page .hero-purchase button:disabled { cursor:wait; opacity:.78; }
        .course-sales-page .checkout-error { max-width:360px; margin:0; color:#fff; font-size:12px; line-height:1.35; }
        .course-sales-page .hero-purchase span { color:#fff; font-family:var(--font-montserrat),Arial,sans-serif !important; font-weight:600 !important; font-size:13px; line-height:1; }
        .course-sales-page .course-content { width:min(76vw,1480px); margin:0 auto; padding:34px 0 90px; }
        .course-sales-page .section-title { margin:0 0 20px; text-align:center; font-family:var(--font-montserrat),Arial,sans-serif; font-size:19px; font-weight:600; text-transform:uppercase; }
        .course-sales-page .section-title::after { content:""; display:block; width:100px; height:1px; margin:14px auto 0; background:#e9ddd4; }
        .course-sales-page .about-card { width:min(560px, 100%); margin:0 auto 37px; padding:31px 34px; border-radius:6px; background:#f4ebe2; text-align:center; font-family:var(--font-hanken-grotesk),Arial,sans-serif; font-size:14px; font-weight:400; line-height:22px; white-space:pre-line; }
        .course-sales-page .inside { margin-top:14px; }
        .course-sales-page .section-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:28px; }
        .course-sales-page .inside-card { min-height:168px; padding:25px; border-radius:6px; background:#f4ebe2; }
        .course-sales-page .inside-card h3 { margin:0 0 17px; font-family:var(--font-montserrat),Arial,sans-serif; font-size:18px; font-weight:600; text-transform:uppercase; }
        .course-sales-page .inside-card p { margin:0; font-family:var(--font-hanken-grotesk),Arial,sans-serif; font-size:14px; font-weight:400; line-height:22px; white-space:pre-line; }
        .course-sales-page .equipment-list-button { margin-top:18px; border:0; border-radius:7px; padding:14px 20px; background:#343434; color:#fff; font-family:var(--font-montserrat),Arial,sans-serif; font-size:14px; font-weight:600; cursor:pointer; }
        .equipment-list-modal { position:fixed; z-index:100; inset:0; display:grid; place-items:center; padding:28px; background:rgba(0,0,0,.58); }
        .equipment-list-modal-card { position:relative; width:min(760px,100%); max-height:calc(100svh - 56px); background:#fff; }
        .equipment-list-modal-card img { display:block; width:100%; max-height:calc(100svh - 56px); object-fit:contain; }
        .equipment-list-close { position:absolute; top:-46px; right:0; border:0; background:transparent; color:#fff; font:300 42px/1 Arial,sans-serif; cursor:pointer; }
        .course-sales-page .back-to-programs { display:flex; width:max-content; min-height:48px; margin:42px auto 0; align-items:center; justify-content:center; border-radius:6px; padding:0 24px; background:#343434; color:#fff; font-family:var(--font-montserrat),Arial,sans-serif; font-size:14px; font-weight:600; text-decoration:none; }
        @media (max-width:900px) {
          .course-sales-page .course-sales-hero { width:100%; height:min(504px, calc(70svh - 56px)); }
          .course-sales-page .course-content { width:min(92vw,720px); }
          .course-sales-page .section-grid { grid-template-columns:1fr; gap:15px; }
          .course-sales-page .hero-heading { top:44px; }
          .course-sales-page .hero-heading p { font-size:13px; }
          .course-sales-page .hero-heading h1 { font-size:36px; }
          .course-sales-page .hero-purchase { bottom:38px; }
          .course-sales-page .hero-purchase form,.course-sales-page .hero-checkout { width:min(58vw,250px); }
        }
        @media (max-width:600px) {
          .course-sales-page .course-sales-hero { height:137vw; min-height:0; }
          .course-sales-page .hero-heading { top:11vw; }
          .course-sales-page .hero-heading p { margin-bottom:7px; font-size:13px; }
          .course-sales-page .hero-heading h1 { font-size:22px; line-height:1.08; letter-spacing:.01em; }
          .course-sales-page .hero-purchase { bottom:32px; gap:4px; }
          .course-sales-page .hero-purchase form,.course-sales-page .hero-checkout { width:220px; }
          .course-sales-page .hero-purchase button { min-height:40px; padding:0 12px; font-size:14px; line-height:21.7px; white-space:nowrap; }
          .course-sales-page .hero-purchase span { font-size:12px; font-weight:500 !important; line-height:19px; }
          .course-sales-page .course-content { width:calc(100% - 40px); padding:34px 0 24px; }
          .course-sales-page .section-title { margin-bottom:16px; font-size:19px; }
          .course-sales-page .section-title::after { width:64px; margin-top:12px; }
          .course-sales-page .about-card { margin-bottom:30px; padding:22px 15px; font-size:13px; line-height:1.55; }
          .course-sales-page .section-grid { gap:10px; }
          .course-sales-page .inside-card { min-height:0; padding:16px 15px; }
          .course-sales-page .inside-card h3 { margin-bottom:15px; font-size:15px; }
          .course-sales-page .inside-card p { font-size:12px; line-height:1.55; }
          .course-sales-page .equipment-list-button { margin-top:16px; padding:14px 18px; font-size:13px; }
          .equipment-list-modal { padding:20px; }
        }
        /* This page must not inherit the legacy DM Sans rules used in the private area. */
        .course-sales-page .hero-heading p,
        .course-sales-page .checkout-error,
        .course-sales-page .about-card,
        .course-sales-page .inside-card p,
        .course-sales-page .sales-story p,
        .course-sales-page .sales-story-conclusion {
          font-family:var(--font-hanken-grotesk),Arial,sans-serif !important;
          font-weight:400 !important;
          font-synthesis:none;
        }
        .course-sales-page .hero-heading h1,
        .course-sales-page .hero-purchase button,
        .course-sales-page .section-title,
        .course-sales-page .inside-card h3,
        .course-sales-page .back-to-programs,
        .course-sales-page .sales-story h2 {
          font-family:var(--font-montserrat),Arial,sans-serif !important;
          font-weight:600 !important;
          font-synthesis:none;
        }
      `}</style>
      <style>{`
        /* About does not use a divider; keep the card close to its heading. */
        .course-sales-page .course-content > .section-title::after { display:none; }
        .course-sales-page .course-content > .section-title { margin-bottom:18px; }
        /* The What's inside divider matches the main-page divider exactly. */
        .course-sales-page .inside > .section-title::after { display:block; width:50px; height:1px; margin:14px auto 0; background:#e8e4df; }
        @media(max-width:900px) {
          .course-sales-page .course-content > .section-title { margin-bottom:18px; }
          .course-sales-page .inside > .section-title::after { width:50px; height:1px; margin-top:14px; }
        }
        @media(max-width:760px) {
          .course-sales-page > .faq { padding:30px 20px!important; background:#f5ece4; }
          .course-sales-page > .faq .eyebrow { margin:0 0 38px!important; font-family:var(--font-montserrat),Arial,sans-serif!important; font-size:18px!important; font-weight:600!important; line-height:18px; }
          .course-sales-page > .faq details { max-width:none; border:0!important; padding:0 0 15px!important; }
          .course-sales-page > .faq summary { align-items:center; font-family:var(--font-hanken-grotesk),Arial,sans-serif!important; font-size:16px!important; font-weight:600!important; line-height:16px; }
          .course-sales-page > .faq summary b { font-family:var(--font-hanken-grotesk),Arial,sans-serif!important; font-size:32px!important; font-weight:300!important; line-height:1; color:#78736d; }
          .course-sales-page > .faq details p { font-family:var(--font-hanken-grotesk),Arial,sans-serif!important; font-size:14px!important; font-weight:300!important; line-height:18px; }
          .course-sales-page > footer { min-height:289px; padding:33px 20px!important; display:flex!important; flex-direction:column!important; justify-content:flex-start!important; gap:20px!important; font-family:var(--font-hanken-grotesk),Arial,sans-serif!important; font-size:14px!important; font-weight:600!important; line-height:18px; }
          .course-sales-page > footer .logo { font-family:var(--font-mulish),Arial,sans-serif!important; font-size:24px!important; font-weight:500!important; letter-spacing:normal!important; }
          .course-sales-page > footer > div { max-width:320px; }
          .course-sales-page > footer a { color:#77706a!important; font-weight:700!important; }
          .course-sales-page > footer .instagram-link { display:grid; place-items:center; width:21px; height:21px; margin-top:1px; color:#333; }
          .course-sales-page > footer .instagram-link svg { width:21px; height:21px; }
        }
      `}</style>
      <SiteHeader nav={nav} ids={ids} cabinet="MY PROGRAMS" anchorPath="/home" />

      <section className="course-sales-hero">
        <div className="course-sales-photo-frame" style={{ "--sales-phone-x": `${course.cover_sales_phone_focus_x ?? course.cover_sales_focus_x ?? course.cover_focus_x ?? 50}%`, "--sales-phone-y": `${course.cover_sales_phone_focus_y ?? course.cover_sales_focus_y ?? course.cover_focus_y ?? 50}%`, "--sales-phone-zoom": course.cover_sales_phone_zoom ?? course.cover_sales_zoom ?? 1, "--sales-tablet-x": `${course.cover_sales_tablet_focus_x ?? course.cover_sales_focus_x ?? course.cover_focus_x ?? 50}%`, "--sales-tablet-y": `${course.cover_sales_tablet_focus_y ?? course.cover_sales_focus_y ?? course.cover_focus_y ?? 50}%`, "--sales-tablet-zoom": course.cover_sales_tablet_zoom ?? course.cover_sales_zoom ?? 1, "--sales-desktop-x": `${course.cover_sales_desktop_focus_x ?? course.cover_sales_focus_x ?? course.cover_focus_x ?? 50}%`, "--sales-desktop-y": `${course.cover_sales_desktop_focus_y ?? course.cover_sales_focus_y ?? course.cover_focus_y ?? 50}%`, "--sales-desktop-zoom": course.cover_sales_desktop_zoom ?? course.cover_sales_zoom ?? 1 } as CSSProperties}>
          <img src={mobileImage} srcSet={`${mobileImage} 1600w, ${image} 2400w`} sizes="100vw" alt={course.title} fetchPriority="high" decoding="async" />
        </div>
        <div className="hero-shade" />
        <div className="hero-heading">
          <p>{course.product_type === "guide" ? "DIGITAL GUIDE" : `${course.weeks ?? 0}-weeks program`}</p>
          <h1>{course.title.toUpperCase()}</h1>
        </div>
        <div className="hero-purchase">
          {hasPayment ? (
            <div className="hero-checkout"><CheckoutButton courseSlug={course.slug} price={price} /></div>
          ) : (
            <button type="button" disabled>COMING SOON</button>
          )}
          {hasDiscount && <span>instead of <s>${oldPrice}</s></span>}
          {!hasPayment && <span>This program is coming soon</span>}
        </div>
      </section>

      <section className="course-content">
        <h2 className="section-title">About the {course.product_type === "guide" ? "guide" : "program"}</h2>
        <div className="about-card">
          {course.description || "Details for this program will be available soon."}
        </div>

        {(sections.length > 0 || (course.product_type === "guide" && course.guide_preview_gallery?.length)) && (
          <section className="inside">
            <h2 className="section-title">What&apos;s inside</h2>
            {course.product_type === "guide" && Array.isArray(course.guide_preview_gallery) && course.guide_preview_gallery.length > 0 && <GuidePreviewCarousel title={course.title} images={course.guide_preview_gallery.map(courseImageUrl).filter((path): path is string => Boolean(path))} />}
            {sections.length > 0 && <div className="section-grid">
              {sections.map((section) => (
                <article className="inside-card" key={section.id}>
                  <h3>{section.title}</h3>
                  <p><RichSectionText text={section.content} /></p>
                  {course.equipment_image_path && /^equipment$/i.test(section.title.trim()) && <EquipmentListButton image={courseImageUrl(course.equipment_image_path) ?? course.equipment_image_path} label={course.equipment_button_label} />}
                </article>
              ))}
            </div>}
          </section>
        )}
        {(course.sales_story_title || course.sales_story_body || (Array.isArray(course.sales_gallery) && course.sales_gallery.length > 0)) && <section className={`sales-story${course.sales_gallery_title?.trim() ? "" : " sales-story--without-gallery-title"}`}>{course.sales_story_title && <h2>{course.sales_story_title === "WHY I STARTED TRAINING MY DEEP CORE" ? <>WHY I STARTED<br />TRAINING MY DEEP CORE</> : course.sales_story_title}</h2>}{course.sales_story_body && <p>{course.sales_story_body}</p>}{Array.isArray(course.sales_gallery) && course.sales_gallery.length > 0 && <>{course.sales_gallery_title?.trim() && <h2 className="sales-gallery-title">{course.sales_gallery_title}</h2>}<div className="sales-story-gallery"><PhotoMarquee images={course.sales_gallery.map(courseImageUrl).filter((path): path is string => Boolean(path))} alt="Program story" className="sales-story-track" /></div></>}</section>}
        {course.sales_story_conclusion && <p className="sales-story-conclusion">{course.sales_story_conclusion}</p>}

      </section>
      <section id="faq" className="faq section">
        <p className="eyebrow">FREQUENTLY ASKED QUESTIONS</p>
        {faqItems.map(([question, answer]) => <details key={question}><summary>{question}<b>+</b></summary><p>{answer}</p></details>)}
      </section>
      <footer><span className="logo">by.alinkins</span><div>If you have any questions, feel free to contact us here: <a href="mailto:byalinkinsupport@gmail.com">byalinkinsupport@gmail.com</a><br/><br/><Link href="/privacypolicy">Privacy Policy</Link><br/><Link href="/termsofuse">Terms of Use</Link><br/><Link href="/disclaimer">Disclaimer</Link></div><a href="https://www.instagram.com/by.alinkins/" target="_blank" rel="noreferrer" aria-label="Instagram" className="instagram-link"><img src="/instagram-alt.svg" alt="" width="25" height="25" /></a></footer>
    </main>
  );
}
