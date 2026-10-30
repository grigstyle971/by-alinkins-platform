"use client";

import { useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase-browser";

type EventProperties = Record<string, string | number | boolean>;

function createVisitorId() {
  const saved = window.localStorage.getItem("by_alinkins_analytics_id");
  if (saved) return saved;

  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem("by_alinkins_analytics_id", id);
  return id;
}

/** Records analytics through the site's own domain, avoiding tracker blocking. */
export default function PostHogAnalytics() {
  const seenSections = useRef(new Set<string>());

  useEffect(() => {
    let distinctId = createVisitorId();
    const openedAt = Date.now();
    const capture = (event: string, properties: EventProperties = {}) => {
      void fetch("/api/posthog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, distinctId, properties }),
        keepalive: true,
      }).catch(() => undefined);
    };

    capture("page_view", { path: window.location.pathname });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target as HTMLElement;
          const sectionKey = `${window.location.pathname}#${section.id}`;
          if (seenSections.current.has(sectionKey)) return;

          seenSections.current.add(sectionKey);
          capture("section_viewed", { section_id: section.id, path: window.location.pathname });
        });
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll<HTMLElement>("section[id]").forEach((section) => observer.observe(section));

    const onClick = (event: MouseEvent) => {
      const element = (event.target as HTMLElement | null)?.closest("a, button");
      if (!element) return;
      capture("element_clicked", {
        label: (element.textContent ?? "").trim().slice(0, 80),
        path: window.location.pathname,
      });
    };
    document.addEventListener("click", onClick, { capture: true });

    const reportEngagement = () =>
      capture("page_engaged", {
        path: window.location.pathname,
        duration_seconds: Math.max(1, Math.round((Date.now() - openedAt) / 1000)),
      });
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") reportEngagement();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", reportEngagement);

    const supabase = getSupabase();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      distinctId = user.id;
      capture("account_identified", { path: window.location.pathname });
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") distinctId = createVisitorId();
      else if (session?.user) {
        distinctId = session.user.id;
        capture("account_identified", { path: window.location.pathname });
      }
    });

    return () => {
      observer?.disconnect();
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", reportEngagement);
      authListener.subscription.unsubscribe();
    };
  }, []);

  return null;
}
