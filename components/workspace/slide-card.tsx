'use client';

import { Expand } from 'lucide-react';
import type { SlideDTO } from '@/lib/shared';

export function SlideCard({ slide, index, total, onOpen }: { slide: SlideDTO; index: number; total: number; onOpen: () => void }) {
  return (
    <figure className="space-y-2">
      <figcaption className="flex items-baseline gap-2">
        <span className="text-[18px] font-bold">
          Slide {index + 1} of {total}
        </span>
        {slide.caption && <span className="text-meta text-fg-muted">{slide.caption}</span>}
      </figcaption>
      <div className="relative rounded-lg border border-border bg-subtle p-2 sm:p-3">
        <button
          type="button"
          onClick={onOpen}
          className="block aspect-video w-full cursor-zoom-in overflow-hidden rounded-md"
          aria-label={`Open slide ${index + 1} full screen`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.url}
            alt={`Slide ${index + 1}`}
            loading={index < 2 ? 'eager' : 'lazy'}
            decoding="async"
            width={slide.width}
            height={slide.height}
            className="h-full w-full object-contain"
          />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-fg-muted shadow-card hover:text-fg"
          aria-label={`Expand slide ${index + 1}`}
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>
    </figure>
  );
}
