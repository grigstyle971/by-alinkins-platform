"use client";

import { useEffect, useRef, useState } from "react";

const triggerDistance = 56;

/** Safari's installed web apps do not provide a native pull-to-refresh gesture. */
export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const updateDistance = (value: number) => {
      distanceRef.current = value;
      document.documentElement.style.setProperty("--pull-refresh-offset", `${value}px`);
      // A transform on the page wrapper changes the containing block for all
      // fixed elements. Only enable it while the user is actually pulling,
      // otherwise fixed lesson navigation would scroll with the document.
      document.documentElement.toggleAttribute("data-pull-refresh-active", value > 0);
      setDistance(value);
    };
    const start = (event: TouchEvent) => {
      if (!refreshingRef.current && window.scrollY <= 0 && event.touches.length === 1) startY.current = event.touches[0].clientY;
    };
    const move = (event: TouchEvent) => {
      if (startY.current === null || refreshingRef.current) return;
      const rawDistance = event.touches[0].clientY - startY.current;
      if (rawDistance <= 0) { updateDistance(0); return; }
      // Replace Safari's elastic overscroll only for an intentional pull from
      // the top edge, leaving normal scrolling and all controls untouched.
      event.preventDefault();
      updateDistance(Math.min(360, rawDistance * 0.52));
    };
    const finish = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (distanceRef.current < triggerDistance) { updateDistance(0); return; }
      refreshingRef.current = true;
      setRefreshing(true);
      updateDistance(Math.max(triggerDistance + 8, Math.min(360, distanceRef.current)));
      window.setTimeout(() => window.location.reload(), 220);
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", finish, { passive: true });
    window.addEventListener("touchcancel", finish, { passive: true });
    return () => { document.documentElement.style.setProperty("--pull-refresh-offset", "0px"); document.documentElement.removeAttribute("data-pull-refresh-active"); window.removeEventListener("touchstart", start); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", finish); window.removeEventListener("touchcancel", finish); };
  }, []);

  return <div className={`app-pull-to-refresh ${distance >= triggerDistance ? "is-ready" : ""} ${refreshing ? "is-refreshing" : ""}`} style={{ transform: "translate(-50%, 18px)", opacity: distance > 0 || refreshing ? 1 : 0 }} aria-hidden="true"><svg viewBox="0 0 40 40">{Array.from({ length: 8 }, (_, index) => <line key={index} x1="20" y1="4" x2="20" y2="10" style={{ opacity: (index + 1) / 8, transform: `rotate(${index * 45}deg)`, transformOrigin: "20px 20px" }} />)}</svg></div>;
}
