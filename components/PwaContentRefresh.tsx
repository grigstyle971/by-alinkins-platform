"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * An installed Android app can resume a previously rendered Next.js route.
 * Refresh protected content whenever that saved view returns to the foreground,
 * so new purchases and changed access rights are shown without a manual reload.
 */
export default function PwaContentRefresh() {
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt.current < 3_000) return;
      lastRefreshAt.current = now;
      router.refresh();
    };

    refresh();
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") refresh(); };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  return null;
}
