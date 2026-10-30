"use client";

import { PointerEvent, useRef, useState } from "react";

type Props = {
  images: string[];
  title: string;
};

export default function GuidePreviewCarousel({ images, title }: Props) {
  const [active, setActive] = useState(0);
  const dragStart = useRef<number | null>(null);

  if (!images.length) return null;

  const go = (index: number) => {
    const length = images.length;
    setActive(((index % length) + length) % length);
  };

  const relativePosition = (index: number) => {
    let distance = index - active;
    const half = images.length / 2;
    if (distance > half) distance -= images.length;
    if (distance < -half) distance += images.length;
    return distance;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) < 42) return;
    go(active + (distance < 0 ? 1 : -1));
  };

  return (
    <div className="guide-preview-carousel" aria-roledescription="carousel" aria-label={`${title} preview`}>
      <div
        className="guide-preview-stage"
        onPointerDown={(event) => { dragStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerUp={finishDrag}
        onPointerCancel={() => { dragStart.current = null; }}
      >
        {images.map((image, index) => {
          const position = relativePosition(index);
          const visible = Math.abs(position) <= 1;
          return (
            <button
              type="button"
              className="guide-preview-slide"
              data-position={position < 0 ? "previous" : position > 0 ? "next" : "active"}
              aria-label={`Preview ${index + 1} of ${images.length}`}
              aria-current={position === 0 ? "true" : undefined}
              aria-hidden={!visible}
              tabIndex={visible ? 0 : -1}
              key={`${image}-${index}`}
              onClick={() => position === 0 ? undefined : go(index)}
            >
              <img src={image} alt={`${title} preview ${index + 1}`} draggable={false} />
            </button>
          );
        })}
        {images.length > 1 && <>
          <button type="button" className="guide-preview-arrow previous" aria-label="Previous preview" onClick={() => go(active - 1)}>‹</button>
          <button type="button" className="guide-preview-arrow next" aria-label="Next preview" onClick={() => go(active + 1)}>›</button>
        </>}
      </div>
      {images.length > 1 && <div className="guide-preview-dots" aria-label="Choose preview">
        {images.map((_, index) => <button type="button" key={index} className={index === active ? "active" : ""} aria-label={`Show preview ${index + 1}`} aria-current={index === active ? "true" : undefined} onClick={() => go(index)} />)}
      </div>}
    </div>
  );
}
