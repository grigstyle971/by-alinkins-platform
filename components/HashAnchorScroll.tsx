"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mobile in-app browsers often apply the URL hash before fonts and responsive
 * images above the target have settled. Re-apply the anchor while the initial
 * layout is stabilising, but stop immediately once the visitor interacts.
 */
export default function HashAnchorScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    if (!window.location.hash && !section) return;

    let cancelled = false;
    const timers: number[] = [];

    const target = () => {
      const id = window.location.hash
        ? decodeURIComponent(window.location.hash.slice(1))
        : section;
      return id ? document.getElementById(id) : null;
    };

    const scrollToTarget = () => {
      if (cancelled) return;
      const element = target();
      if (!element) return;

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      element.scrollIntoView({ block: "start", inline: "nearest" });
      root.style.scrollBehavior = previousBehavior;
    };

    const stopFollowing = () => { cancelled = true; };
    const schedule = (delay: number) => timers.push(window.setTimeout(scrollToTarget, delay));

    // The immediate pass handles normal browsers. Later passes cover Instagram
    // and Telegram browsers where fonts/images change the page height afterward.
    window.requestAnimationFrame(scrollToTarget);
    schedule(160);
    schedule(550);
    schedule(1200);

    if (document.readyState !== "complete") window.addEventListener("load", scrollToTarget, { once: true });
    void document.fonts?.ready.then(scrollToTarget);
    void Promise.allSettled(
      Array.from(document.images)
        .filter((image) => !image.complete)
        .map((image) => image.decode().catch(() => undefined)),
    ).then(scrollToTarget);

    window.addEventListener("hashchange", scrollToTarget);
    window.addEventListener("pointerdown", stopFollowing, { once: true, passive: true });
    window.addEventListener("touchstart", stopFollowing, { once: true, passive: true });
    window.addEventListener("wheel", stopFollowing, { once: true, passive: true });

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      window.removeEventListener("load", scrollToTarget);
      window.removeEventListener("hashchange", scrollToTarget);
      window.removeEventListener("pointerdown", stopFollowing);
      window.removeEventListener("touchstart", stopFollowing);
      window.removeEventListener("wheel", stopFollowing);
    };
  }, [pathname]);

  return null;
}
