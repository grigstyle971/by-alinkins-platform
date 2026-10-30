import SiteHeader from "@/components/SiteHeader";

type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Props = {
  title: string;
  sections: LegalSection[];
  updated?: string;
};

export default function LegalPage({ title, sections, updated = "25.08.2026" }: Props) {
  return (
    <main className="legal-page">
      <SiteHeader
        nav={["About me", "Workout programs", "Transformation results", "FAQ"]}
        ids={["about-me", "workout-programs", "transformation-results", "faq"]}
        cabinet="MY PROGRAMS"
        anchorPath="/home"
      />
      <article className="legal-document">
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
        {sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          </section>
        ))}
      </article>
    </main>
  );
}
