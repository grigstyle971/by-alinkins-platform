export type Course = { slug: string; title: string; weeks: number; price: number; stripePriceId: string; description: string; image: string; imagePosition?: string; imageZoom?: number; status: "available" | "coming-soon"; productType?: "course" | "guide" };

export const courses: Course[] = [
  { slug: "deep-core", title: "Deep Core", weeks: 6, price: 59, stripePriceId: "price_REPLACE_ME", status: "coming-soon", description: "A focused 6-week core program. Join the waitlist to be first to know.", image: "/images/Deep-Core.jpg" }
];

export const getCourse = (slug: string) => courses.find((course) => course.slug === slug);
