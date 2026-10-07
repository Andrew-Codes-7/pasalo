"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/**
 * Swipe/scroll gallery with dot indicators. Uses native scroll-snap rather
 * than a carousel library so it feels right on a phone and costs nothing.
 */
export function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((src, i) => (
          <div
            key={src}
            // Square, capped, and object-contain rather than a landscape crop.
            // Phone photos are usually portrait, and cover-cropping them to 4:3
            // showed only a middle band — a backpack became a strip of fabric.
            // Letterboxing shows the whole item, which is the point of a
            // marketplace photo.
            className="relative aspect-square max-h-[62vh] w-full shrink-0 snap-center bg-surface-3"
          >
            <Image
              src={src}
              alt={`${alt} — photo ${i + 1} of ${photos.length}`}
              fill
              sizes="(min-width: 640px) 600px, 100vw"
              priority={i === 0}
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div
          className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5"
          aria-hidden="true"
        >
          {photos.map((src, i) => (
            <span
              key={src}
              className={[
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/55",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
