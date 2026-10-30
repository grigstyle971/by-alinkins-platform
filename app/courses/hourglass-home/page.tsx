import DynamicCoursePage from "../[slug]/page";

export const dynamic = "force-dynamic";

// Keep the old public URL, but render the single database-driven course page.
// This makes the course cover, price, description and cards editable in /admin.
export default function HourglassHomePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  return <DynamicCoursePage params={Promise.resolve({ slug: "hourglass-home" })} searchParams={searchParams} />;
}

/* Legacy hard-coded page retained below only as a reference. */
/*

import Image from "next/image";
import { useState } from "react";
import { getCourse } from "@/lib/courses";
import SiteHeader from "@/components/SiteHeader";

const nav = ["About me", "Workout Programs", "Transformation Results", "FAQ"] as const;
const ids = ["about-me", "workout-programs", "transformation-results", "faq"] as const;

export default function HourglassHome() {
  const course = getCourse("hourglass-home")!;
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  return (
    <main className="course-sales-page">
      <style>{`.course-sales-page{background:#fff;color:#050505;min-height:100vh}.course-hero{width:min(75vw,1440px);height:850px;margin:0 auto;position:relative;overflow:hidden}.course-hero>img{object-fit:cover;object-position:center}.course-hero-shade{position:absolute;inset:0;background:rgba(0,0,0,.44)}.course-hero-content{position:absolute;z-index:1;inset:48px 25px auto;text-align:center;color:#fff}.course-hero-content p{margin:0 0 12px;font-size:18px;font-weight:700}.course-hero-content h1{margin:0;font-size:42px;letter-spacing:.5px}.course-hero-buy{position:absolute;z-index:1;left:50%;bottom:46px;transform:translateX(-50%);display:grid;justify-items:center;gap:13px;color:#fff;font-weight:700}.course-hero-buy button{background:#fff;color:#050505;border:0;border-radius:7px;padding:18px 34px;font:700 20px Arial,sans-serif;white-space:nowrap;cursor:pointer}.course-hero-buy span{font-size:16px}.course-about,.course-inside{padding:36px 24px 28px}.course-about h2,.course-inside>h2{text-align:center;font:700 19px Arial,sans-serif;margin:0 0 20px}.course-about h2::after,.course-inside>h2::after{content:"";display:block;width:100px;height:1px;background:#e9ddd4;margin:15px auto 0}.course-about-card{max-width:560px;margin:auto;background:#f4ebe3;border-radius:5px;padding:31px 28px;text-align:center;font-size:14px;line-height:1.35}.course-inside{padding-top:8px;max-width:1488px;margin:auto}.course-inside-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:30px;align-items:start}.course-inside-grid article{background:#f4ebe3;border-radius:5px;padding:24px 20px;min-height:328px;font-size:16px;line-height:1.55}.course-inside-grid article:first-child{min-height:553px}.course-inside-grid h3{margin:0 0 13px;font-size:18px}.course-inside-grid p{margin:0 0 27px}.course-inside-grid strong{font-weight:700}.course-equipment button{border:0;border-radius:4px;background:#333;color:#fff;font:700 15px Arial,sans-serif;padding:15px 17px;cursor:pointer}.equipment-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.6)}.equipment-modal-card{position:relative;width:min(560px,100%);background:#fff}.equipment-modal-card img{display:block;width:100%;height:auto}.equipment-modal-close{position:absolute;top:-45px;right:-3px;border:0;background:transparent;color:#fff;font-size:42px;font-weight:200;line-height:1;cursor:pointer}@media(max-width:760px){.course-hero{width:100%;height:calc(100svh - 76px);min-height:560px}.course-hero-content{inset:50px 18px auto}.course-hero-content h1{font-size:32px;line-height:1.05}.course-hero-buy{bottom:44px;width:calc(100% - 40px)}.course-hero-buy button{font-size:16px;padding:16px;width:100%}.course-about,.course-inside{padding:45px 20px 12px}.course-about-card{font-size:14px;padding:25px 18px}.course-about-card br{display:none}.course-inside-grid{grid-template-columns:1fr;gap:14px}.course-inside-grid article,.course-inside-grid article:first-child{min-height:auto;padding:24px 20px}.course-inside-grid p{margin-bottom:23px}.equipment-modal{padding:18px}.equipment-modal-close{top:-39px;font-size:36px}}`}</style>
      <SiteHeader nav={nav} ids={ids} cabinet="MY PROGRAMS" anchorPath="/home" />
      <style>{`@media(max-width:760px){.course-sales-page .course-hero{height:133.4vw!important;min-height:0!important}.course-sales-page .course-hero-content{inset:13vw 18px auto!important}.course-sales-page .course-hero-content p{margin-bottom:8px!important;font-size:16px!important}.course-sales-page .course-hero-content h1{font-size:24px!important;line-height:1.08!important;letter-spacing:.015em!important}.course-sales-page .course-hero-buy{bottom:44px!important;width:calc(100% - 40px)!important;gap:10px!important}.course-sales-page .course-hero-buy button{min-height:0!important;padding:16px!important;font-size:16px!important;line-height:1.15!important}.course-sales-page .course-hero-buy span{font-size:14px!important;line-height:1!important}}`}</style>
      <section className="course-hero">
        <Image
  src="/images/hourglass-hero.jpg"
  fill
  priority
  sizes="100vw"
  alt="Hourglass Home workout"
/>
        <div className="course-hero-shade" />
        <div className="course-hero-content"><p>{course.weeks} weeks program</p><h1>HOURGLASS HOME</h1></div>
        <form className="course-hero-buy" action="/api/checkout" method="POST"><input type="hidden" name="courseSlug" value={course.slug} /><button type="submit">GET ACCESS FOR ONLY ${course.price}</button><span>instead of <s>$100</s></span></form>
      </section>
      <section className="course-about"><h2>ABOUT THE PROGRAM</h2><div className="course-about-card">The Hourglass program is designed to help you <strong>build balanced proportions</strong> with a snatched waist, fuller glutes, and a strong, beautifully shaped back right from home.</div></section>
      <section className="course-inside"><h2>WHAT&apos;S INSIDE</h2><div className="course-inside-grid">
        <article><h3>TRAINING</h3><p><strong>9-week structured home training plan</strong><br />with progressive overload</p><p><strong>3 workouts per week</strong><br />(2 lower body + 1 upper body)</p><p><strong>Step-by-step video guidance</strong><br />with my voice-over</p><p><strong>Built-in progression system</strong><br />so you&apos;ll always know when to increase weights, reps, or intensity, based on your current level</p><p><strong>Pre- &amp; post-workout stretching routines</strong></p><p><strong>Full Cardio Guide</strong><br />Everything you need to know about cardio</p><p><strong>1-year access</strong></p></article>
        <article><h3>NUTRITION</h3><p><strong>Complete nutrition guide</strong><br />My practical recommendations for balanced eating, mindful food choices, and healthy habits</p><p><strong>Private Macro Calculator</strong><br />Personalized calorie &amp; macro targets</p><p><strong>Body Composition Nutrition</strong><br />Simple strategies for fat loss, muscle gain, and body recomposition</p></article>
        <article className="course-equipment"><h3>EQUIPMENT</h3><p>Everything you&apos;ll need to complete the program from home</p><button type="button" onClick={() => setEquipmentOpen(true)}>View Equipment List</button></article>
      </div></section>
      {equipmentOpen && <div className="equipment-modal" role="dialog" aria-modal="true" aria-label="Equipment list" onClick={() => setEquipmentOpen(false)}><div className="equipment-modal-card" onClick={(event) => event.stopPropagation()}><button className="equipment-modal-close" type="button" aria-label="Close equipment list" onClick={() => setEquipmentOpen(false)}>×</button><Image src="/images/equipment-hourglass.jpg" width={560} height={373} alt="Hourglass Home equipment list" priority /></div></div>}
    </main>
  );
}
*/
