"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export default function CourseLearnMoreLink({ href, image, children }: { href: string; image: string; children: React.ReactNode }) {
  const router = useRouter();
  const prepare = () => {
    router.prefetch(href);
    const preload = new window.Image();
    // The card uses a 960px copy. Prime the hero-sized cached rendition before
    // navigation as well, so the course page never starts with a gray cover.
    preload.src = image.includes("/api/course-image?")
      ? image.replace(/([?&]width=)960\b/, (_, prefix) => `${prefix}1600`)
      : image;
  };
  const navigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    prepare();
    document.documentElement.classList.add("page-is-leaving");
    window.setTimeout(() => {
      router.push(href);
      window.setTimeout(() => document.documentElement.classList.remove("page-is-leaving"), 420);
    }, 170);
  };
  return <Link href={href} className="button dark" onMouseEnter={prepare} onTouchStart={prepare} onClick={navigate}>{children}</Link>;
}
