"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type Transformation = { id: string; image: string; caption?: string | null };
export type Review = { id: string; text: string; name: string };

type Props = { transformations?: Transformation[]; reviews?: Review[] };

export default function ResultsAndReviews({ transformations = [], reviews = [] }: Props) {
  const [resultIndex, setResultIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewCardHeight, setReviewCardHeight] = useState(0);
  const resultTouchStart = useRef<number | null>(null);
  const reviewTouchStart = useRef<number | null>(null);
  const reviewCardRef = useRef<HTMLElement>(null);
  const hasResults = transformations.length > 0;
  const hasReviews = reviews.length > 0;

  useEffect(() => {
    if (!hasResults) return;
    const adjacent = [
      transformations[(resultIndex + 1) % transformations.length]?.image,
      transformations[(resultIndex - 1 + transformations.length) % transformations.length]?.image,
    ];
    adjacent.filter(Boolean).forEach((src) => { const image = new window.Image(); image.src = src; });
  }, [hasResults, resultIndex, transformations]);

  useLayoutEffect(() => {
    const card = reviewCardRef.current;
    if (!card) return;
    const measure = () => setReviewCardHeight(Math.ceil(card.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    return () => observer.disconnect();
  }, [reviewIndex, reviews]);

  const nextResult = () => setResultIndex((index) => (index + 1) % transformations.length);
  const previousResult = () => setResultIndex((index) => (index - 1 + transformations.length) % transformations.length);
  const nextReview = () => setReviewIndex((index) => (index + 1) % reviews.length);
  const previousReview = () => setReviewIndex((index) => (index - 1 + reviews.length) % reviews.length);
  const finishSwipe = (start: number | null, end: number, next: () => void, previous: () => void) => {
    if (start === null || Math.abs(end - start) < 36) return;
    if (end < start) next(); else previous();
  };

  if (!hasResults && !hasReviews) return null;
  const Arrow = ({ right = false }: { right?: boolean }) => <svg viewBox="0 0 20 20" aria-hidden="true" className={right ? "arrow-icon right" : "arrow-icon"}><path d="m12 4-6 6 6 6" /></svg>;
  return <><style>{`.transformation-showcase{background:#f5ece4;padding:90px 0 45px;text-align:center}.transformation-showcase h2,.review-showcase h2{margin:0;font-family:var(--font-montserrat),Arial,sans-serif;font-size:18px;font-weight:600;line-height:1.2}.transformation-showcase>p{margin:4px auto 18px;max-width:320px;font-family:var(--font-hanken-grotesk),Arial,sans-serif;font-size:14px;font-weight:300;line-height:14px}.results-slider{position:relative;display:block;width:100%;margin:0}.slider-arrow{display:grid;place-items:center;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:#fff;color:#777;cursor:pointer;transition:transform .2s ease,background .2s ease}.slider-arrow:hover{transform:scale(1.06);background:#fff}.arrow-icon{display:block;width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.arrow-icon.right{transform:rotate(180deg)}.result-single{position:relative;overflow:hidden;width:100%;margin:0;aspect-ratio:375/326;border-radius:0;touch-action:pan-y;background:#e9dfd6}.result-single img{object-fit:cover;animation:result-enter .32s ease both}.result-single figcaption{position:absolute;z-index:1;left:12px;right:12px;bottom:12px;padding:7px 10px;border-radius:8px;background:rgba(20,20,20,.55);color:#fff;font-size:12px;text-align:left}@keyframes result-enter{from{opacity:.35;transform:scale(1.025)}to{opacity:1;transform:scale(1)}}.results-slider>.slider-arrow{position:absolute;top:50%;z-index:2;transform:translateY(-50%)}.results-slider>.slider-arrow:first-child{left:5px}.results-slider>.slider-arrow:last-child{right:5px}.results-slider>.slider-arrow:hover{transform:translateY(-50%) scale(1.06)}.result-dots{display:flex;justify-content:center;gap:7px;margin-top:24px}.result-dots button{width:6px;height:6px;border:0;border-radius:50%;padding:0;background:#eee8e1;cursor:pointer;transition:transform .2s ease,background .2s ease}.result-dots button.active{background:#333;transform:none}.review-showcase{padding:30px 0 45px;text-align:center}.review-stage{display:grid;grid-template-columns:24px minmax(0,230px) 24px;justify-content:center;align-items:center;gap:20px;margin-top:24px;transition:height .36s cubic-bezier(.2,.8,.2,1)}.review-card{box-sizing:border-box;width:100%;margin:0;padding:25px 20px 20px;border-radius:14px;background:#f5ece4;font-family:var(--font-hanken-grotesk),Arial,sans-serif;font-size:14px;font-weight:300;line-height:16px;overflow-wrap:anywhere;word-break:break-word;touch-action:pan-y;animation:review-enter .38s cubic-bezier(.2,.8,.2,1) both}.review-stage .slider-arrow{background:#333;color:#fff}.review-card p{margin:0;overflow-wrap:anywhere;word-break:break-word}.review-card strong{display:block;margin-top:14px;font-family:var(--font-montserrat),Arial,sans-serif;font-size:16px;font-weight:600;line-height:16px}.review-stage .slider-arrow{justify-self:center}@keyframes review-enter{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}@media(min-width:761px){.transformation-showcase{padding:90px 20px 45px}.results-slider{max-width:960px;margin:auto}.result-single{max-width:960px;margin:auto}.review-showcase{padding:60px 78px 45px}.review-stage{grid-template-columns:30px minmax(0,420px) 30px}.review-card{padding:28px 30px}}`}</style>
    {hasResults && <section id="transformation-results" className="transformation-showcase"><h2>BE INSPIRED BY REAL RESULTS</h2><p>of girls who&apos;ve already changed their lives with me</p><div className="results-slider"><button className="slider-arrow" onClick={previousResult} aria-label="Previous result"><Arrow /></button><figure className="result-single" onTouchStart={(event) => { resultTouchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => finishSwipe(resultTouchStart.current, event.changedTouches[0]?.clientX ?? 0, nextResult, previousResult)}><Image key={transformations[resultIndex].id} src={transformations[resultIndex].image} fill priority={resultIndex === 0} unoptimized sizes="(max-width: 760px) calc(100vw - 112px), 460px" quality={78} alt={transformations[resultIndex].caption || "Client transformation result"} />{transformations[resultIndex].caption && <figcaption>{transformations[resultIndex].caption}</figcaption>}</figure><button className="slider-arrow" onClick={nextResult} aria-label="Next result"><Arrow right /></button></div><div className="result-dots">{transformations.map((item, index) => <button key={item.id} className={index === resultIndex ? "active" : ""} onClick={() => setResultIndex(index)} aria-label={`Show result ${index + 1}`} />)}</div></section>}
    {hasReviews && <section className="review-showcase"><h2>REVIEWS</h2><div className="review-stage" style={reviewCardHeight ? { height: reviewCardHeight } : undefined}><button className="slider-arrow" onClick={previousReview} aria-label="Previous review"><Arrow /></button><article ref={reviewCardRef} key={reviews[reviewIndex].id} className="review-card" onTouchStart={(event) => { reviewTouchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => finishSwipe(reviewTouchStart.current, event.changedTouches[0]?.clientX ?? 0, nextReview, previousReview)}><p>{reviews[reviewIndex].text}</p><strong>{reviews[reviewIndex].name}</strong></article><button className="slider-arrow" onClick={nextReview} aria-label="Next review"><Arrow right /></button></div><div className="review-dots">{reviews.map((item, index) => <button key={item.id} className={index === reviewIndex ? "active" : ""} onClick={() => setReviewIndex(index)} aria-label={`Show review ${index + 1}`} />)}</div></section>}
  </>;
}
