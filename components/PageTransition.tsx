"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const leaveDuration = 90;

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("page-is-leaving");
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const origin = event.target as Element | null;
      const link = origin?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download") || link.dataset.noPageTransition !== undefined) return;

      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      const href = `${url.pathname}${url.search}${url.hash}`;
      router.prefetch(href);
      document.documentElement.classList.add("page-is-leaving");
      window.setTimeout(() => router.push(href), leaveDuration);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
