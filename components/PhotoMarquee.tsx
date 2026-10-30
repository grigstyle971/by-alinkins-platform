"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  images: string[];
  alt: string;
  className: string;
  itemClassName?: string;
};

// A fixed pixel velocity keeps the motion identical regardless of how many
// photos the CMS contains. requestAnimationFrame avoids Safari's inconsistent
// timing for very wide, CSS-animated tracks.
export default function PhotoMarquee({ images, alt, className, itemClassName }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  // Two repetitions are not enough when a short gallery is viewed on a wide
  // tablet. Add exactly as many copies as are needed to cover the viewport,
  // plus one spare cycle. This happens before the browser paints, so no blank
  // strip is visible while the marquee starts.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;
    const first = track.children[0] as HTMLElement | undefined;
    const nextCycle = track.children[images.length] as HTMLElement | undefined;
    const viewport = track.parentElement;
    if (!first || !nextCycle || !viewport) return;
    const cycleWidth = nextCycle.offsetLeft - first.offsetLeft;
    if (!cycleWidth) return;
    const requiredCopies = Math.max(2, Math.ceil(viewport.clientWidth / cycleWidth) + 2);
    setCopies((current) => current === requiredCopies ? current : requiredCopies);
  }, [images, copies]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length === 0) return;

    let frame = 0;
    let lastTime = performance.now();
    let offset = 0;
    let loopWidth = 0;
    const speed = 55; // pixels per second on every browser and screen size
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      const nextCycle = track.children[images.length] as HTMLElement | undefined;
      loopWidth = first && nextCycle ? nextCycle.offsetLeft - first.offsetLeft : 0;
    };
    const tick = (now: number) => {
      const elapsed = Math.min(now - lastTime, 64);
      lastTime = now;
      if (loopWidth > 0) {
        offset = (offset + (elapsed * speed) / 1000) % loopWidth;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(track);
    track.parentElement && observer?.observe(track.parentElement);
    track.querySelectorAll("img").forEach((image) => image.addEventListener("load", measure));
    measure();
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      track.querySelectorAll("img").forEach((image) => image.removeEventListener("load", measure));
    };
  }, [images, copies]);

  const duplicated = Array.from({ length: copies }, () => images).flat();
  return <div ref={trackRef} className={`${className} js-photo-marquee`}>
    {duplicated.map((src, index) => itemClassName
      ? <div className={itemClassName} key={`${src}-${index}`}><img src={src} alt={alt} loading="eager" decoding="async" /></div>
      : <img key={`${src}-${index}`} src={src} alt={alt} loading="eager" decoding="async" />
    )}
  </div>;
}
