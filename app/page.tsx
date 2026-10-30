import Image from "next/image";
import Link from "next/link";
import { courses, type Course } from "@/lib/courses";
import SiteHeader from "@/components/SiteHeader";
import CourseLearnMoreLink from "@/components/CourseLearnMoreLink";
import ResultsAndReviews, { type Review, type Transformation } from "@/components/ResultsAndReviews";
import PhotoMarquee from "@/components/PhotoMarquee";

const lifestyleImages = ["/images/gallery/1.JPEG", "/images/gallery/2.JPEG", "/images/gallery/3.JPEG", "/images/gallery/4.JPEG", "/images/gallery/5.JPEG", "/images/gallery/6.JPEG", "/images/gallery/7.JPEG", "/images/gallery/8.JPEG"];

const copy = {
  en: { nav: ["About me", "Workout programs", "Transformation results", "FAQ"], ids: ["about-me", "workout-programs", "transformation-results", "faq"], cabinet: "MY PROGRAMS", hero: "step into your dream body era!⌛", start: "START NOW", hello: "Hi, my name is Alina", intro: "I know what it feels like to look in the mirror and see a body that feels far from your dream shape.", story: "For years, I was trying to figure out what actually worked. I tried different training styles, made plenty of mistakes, and spent countless hours learning how to build the body I wanted. Over time, I realized that real progress doesn't come from doing more. It comes from following the right plan, staying consistent, and understanding how your body responds.\nMy goal is simple: to help make your journey easier than mine was.", programs: "WORKOUT PROGRAMS", weeks: "weeks program", learn: "LEARN MORE", soon: "COMING SOON", results: "BE INSPIRED BY REAL RESULTS", resultsSub: "of girls who've already changed their lives", faq: "FREQUENTLY ASKED QUESTIONS", faqItems: ["How long will I have access to the program?", "How do I access the program?", "Does the program include form checks?", "What is your refund policy?", "What payment methods are available?", "Will I receive a receipt after purchase?", "What language are the programs available in?"], answer: "Program details will be shown here. Replace this answer in the CMS before launch.", contact: "If you have any questions, feel free to contact us here:" },
} as const;

export function Storefront({ showHero = true, courseList = courses, guideList = [], transformations, reviews }: { showHero?: boolean; courseList?: Course[]; guideList?: Course[]; transformations?: Transformation[]; reviews?: Review[] }) {
  const t = copy.en;
  return <main className="storefront-page"><style>{` .hero img { filter: saturate(1.3) contrast(1.05) brightness(1); } .hero .overlay { background: rgba(8, 18, 26, .30) !important; } @media (min-width: 761px) { .hero img { width: 100% !important; height: 100% !important; inset: 0 !important; object-fit: cover !important; object-position: center 53% !important; } .hero-copy { transform: translateY(-180px) !important } } @media (max-width: 760px) { .hero-copy { transform: translateY(-26vh) !important; font-size: clamp(24px, 6.5vw, 30px) !important; line-height: 1.1 !important; } .hero-copy .button { margin-top: 30px !important; padding: 16px 28px !important; } .storefront-page .storefront-about .about-copy h1 { letter-spacing:normal !important; } .storefront-page .storefront-about .about-copy p, .storefront-page .storefront-about .story { font-family:var(--font-hanken-grotesk),Arial,sans-serif !important; font-weight:300 !important; } .storefront-page .storefront-about .about-copy p { font-size:14px !important; line-height:14px !important; letter-spacing:normal !important; } .storefront-page .storefront-about .about-divider { display:block; width:50px; height:1px; margin:26px auto 21px; background:#e8e4df; } .storefront-page .storefront-about .story { margin-top:0 !important; font-size:12px !important; line-height:19px !important; letter-spacing:1px !important; } }`}</style>
    <style>{`@media(max-width:760px){.storefront-page > .nav .hamburger{display:flex;flex-direction:column;justify-content:center;gap:5px!important}.storefront-page > .nav .hamburger i{box-sizing:border-box;width:100%!important;height:3px!important;min-height:3px!important;flex:0 0 3px!important;border-radius:999px!important}}`}</style>
    <style>{`@media(max-width:760px){.storefront-page > .nav .hamburger i{height:2px!important;min-height:2px!important;flex-basis:2px!important}}`}</style>
    <style>{`@media(max-width:760px){.storefront-page .programs .eyebrow{font-family:var(--font-montserrat),Arial,sans-serif!important;font-weight:600!important}.storefront-page .course h2{font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-weight:400!important;letter-spacing:0!important}}`}</style>
    <style>{`@media(max-width:760px){.storefront-page .course .button.dark{font-family:var(--font-montserrat),Arial,sans-serif!important;font-weight:400!important;letter-spacing:0!important}}`}</style>
    <style>{`@media(max-width:760px){.storefront-page .course h2{font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-weight:700!important;font-size:16px!important;letter-spacing:normal!important}.storefront-page .course p{font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-weight:300!important}.storefront-page .course .button.dark{font-family:var(--font-mulish),Arial,sans-serif!important;font-weight:600!important;font-size:14px!important;letter-spacing:normal!important}}`}</style>
    <style>{`@media(max-width:760px){.storefront-page>.faq{padding:30px 20px!important;background:#f5ece4}.storefront-page>.faq .eyebrow{margin:0 0 38px!important;font-family:var(--font-montserrat),Arial,sans-serif!important;font-size:18px!important;font-weight:600!important;line-height:18px}.storefront-page>.faq details{max-width:none;border:0!important;padding:0 0 15px!important}.storefront-page>.faq summary{align-items:center;font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-size:16px!important;font-weight:600!important;line-height:16px}.storefront-page>.faq summary b{font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-size:32px!important;font-weight:300!important;line-height:1;color:#78736d}.storefront-page>.faq details p{font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-size:14px!important;font-weight:300!important;line-height:18px}.storefront-page>footer{min-height:289px;padding:33px 20px!important;display:flex!important;flex-direction:column!important;justify-content:flex-start!important;gap:20px!important;font-family:var(--font-hanken-grotesk),Arial,sans-serif!important;font-size:14px!important;font-weight:600!important;line-height:18px}.storefront-page>footer .logo{font-family:var(--font-mulish),Arial,sans-serif!important;font-size:24px!important;font-weight:500!important;letter-spacing:normal!important}.storefront-page>footer>div{max-width:320px}.storefront-page>footer a{color:#77706a!important;font-weight:700!important}.storefront-page>footer .instagram-link{display:grid;place-items:center;width:21px;height:21px;margin-top:1px;color:#333}.storefront-page>footer .instagram-link svg{width:21px;height:21px}}`}</style>
    <SiteHeader nav={t.nav} ids={t.ids} cabinet={t.cabinet}/>
    {showHero && <section className="hero"><Image src="/images/hero-original.JPEG" alt="Woman at the sea" fill priority quality={100} sizes="100vw"/><div className="overlay"/><div className="hero-copy"><p>{t.hero}</p><a href="#workout-programs" className="button light">{t.start}</a></div></section>}
    <section id="about-me" className="about section storefront-about"><div className="portrait"><Image src="/images/about-alina.jpg" alt="Alina" fill sizes="(max-width: 800px) 100vw, 50vw"/></div><div className="about-copy"><h1>{t.hello}</h1><p>{t.intro}</p><span className="about-divider" aria-hidden="true"/></div><p className="story">{t.story}</p></section>
    <section className="strip" aria-label="Lifestyle gallery"><PhotoMarquee images={lifestyleImages} alt="Alina training and lifestyle" className="strip-track" itemClassName="strip-card" /></section>
    <section id="workout-programs" className="programs section"><p className="eyebrow">{t.programs}</p><div className="course-grid">{courseList.map((course) => <article className="course" key={course.slug}><div className="course-image"><Image src={course.image} fill sizes="(max-width: 700px) 100vw, 45vw" quality={100} alt={course.title} style={{ objectPosition: course.imagePosition ?? "50% 50%", transform: `scale(${course.imageZoom ?? 1})`, transformOrigin: course.imagePosition ?? "50% 50%" }} /></div><h2>{course.title}</h2><p>{course.weeks}-{t.weeks}</p>{course.status === "available" ? <CourseLearnMoreLink href={`/courses/${course.slug}`} image={course.image}>{t.learn}</CourseLearnMoreLink> : <button className="button dark" disabled>{t.soon}</button>}</article>)}</div></section>
    {guideList.length > 0 && <section id="guides" className="programs section"><p className="eyebrow">GUIDES</p><div className="course-grid">{guideList.map((guide) => <article className="course" key={guide.slug}><div className="course-image"><Image src={guide.image} fill sizes="(max-width: 700px) 100vw, 45vw" quality={100} alt={guide.title} style={{ objectPosition: guide.imagePosition ?? "50% 50%", transform: `scale(${guide.imageZoom ?? 1})`, transformOrigin: guide.imagePosition ?? "50% 50%" }} /></div><h2>{guide.title}</h2><p>Digital guide</p>{guide.status === "available" ? <Link href={`/courses/${guide.slug}`} className="button dark">{t.learn}</Link> : <button className="button dark" disabled>{t.soon}</button>}</article>)}</div></section>}
    <ResultsAndReviews transformations={transformations} reviews={reviews} />
  <section id="faq" className="faq section">
  <p className="eyebrow">{t.faq}</p>

  {[
    {
      q: "How long will I have access to the program?",
      a: "You get lifetime access to the training program."
    },
    {
      q: "How do I access the program?",
      a: <>After purchase, you&apos;ll receive your login details via the email address you provided during checkout.<br /><br />All course materials are available inside your personal account and will be accessible immediately after you log in.</>
    },
    {
      q: "Does the program include form checks?",
      a: <>This program is designed for independent training, so personal form feedback is <strong>not</strong> included.<br /><br />If you&apos;re unsure about your exercise technique, record yourself from the side and compare your form to the exercise videos provided in the program.<br /><br />This will help you improve your technique, understand movement patterns, and identify mistakes when needed.</>
    },
    {
      q: "What is your refund policy?",
      a: <>Refunds are <strong>not</strong> available for any training programs, as they are digital products and access is granted automatically immediately after purchase.</>
    },
    {
      q: "What payment methods are available?",
      a: <>Payment can be made using <strong>Visa</strong> or <strong>Mastercard</strong>. You can also pay with <strong>Apple Pay</strong> or <strong>Google Pay</strong>.<br /><br />If you have questions about payment, please contact:<br /><strong>byalinkinsupport@gmail.com</strong></>
    },
    {
      q: "Will I receive a receipt after purchase?",
      a: "Yes. A payment receipt will be sent to your email after the transaction is completed."
    },
    {
      q: "What language are the programs available in?",
      a: "The programs are fully available in English."
    }
  ].map((item) => (
    <details key={item.q}>
      <summary>
        {item.q}
        <b>+</b>
      </summary>
      <p>{item.a}</p>
    </details>
  ))}
</section>
    <footer><span className="logo">by.alinkins</span><div>{t.contact} <a href="mailto:byalinkinsupport@gmail.com">byalinkinsupport@gmail.com</a><br/><br/><Link href="/privacypolicy">Privacy Policy</Link><br/><Link href="/termsofuse">Terms of Use</Link><br/><Link href="/disclaimer">Disclaimer</Link></div><a href="https://www.instagram.com/by.alinkins/" target="_blank" rel="noreferrer" aria-label="Instagram" className="instagram-link"><img src="/instagram-alt.svg" alt="" width="25" height="25" /></a></footer>
  </main>;
}
export default function Home() { return <LandingPage />; }

export function LandingPage() {
  const t = copy.en;
  const contentPath = "/home";
  return <main className="landing-page"><style>{` .hero img { filter: saturate(1.3) contrast(1.05) brightness(1); } .hero .overlay { background: rgba(8, 18, 26, .30) !important; } @media (min-width: 761px) { .hero img { width: 100% !important; height: 100% !important; inset: 0 !important; object-fit: cover !important; object-position: center 53% !important; } .hero-copy { transform: translateY(-180px) !important } } @media (max-width: 760px) { .hero-copy { transform: translateY(-10vh) !important; font-size: 12px !important; line-height: 1.1 !important; } .hero-copy p { transform:translateY(1px) !important; } .hero-copy .button { margin-top: 10px !important; padding: 16px 28px !important; } }`}</style>
    <SiteHeader nav={t.nav} ids={t.ids} cabinet={t.cabinet} anchorPath={contentPath} mobileLanguageSwitch/>
    <section className="hero"><Image src="/images/hero-original.JPEG" alt="Woman at the sea" fill priority quality={82} sizes="100vw"/><div className="overlay"/><div className="hero-copy"><p>{t.hero}</p><Link href={`${contentPath}#workout-programs`} className="button light">
  {t.start}
</Link></div></section>
  </main>;
}
