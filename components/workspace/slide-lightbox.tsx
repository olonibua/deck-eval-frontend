'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, LayoutGrid, Maximize, Minimize, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { SlideDTO } from '@/lib/shared';
import { cn } from '@/lib/cn';

const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 25;

const toolButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40';

export function SlideLightbox({
  slides,
  responseLabel,
  index,
  onIndexChange,
  onClose,
}: {
  slides: SlideDTO[];
  responseLabel: string;
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showThumbs, setShowThumbs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const open = index !== null;
  const slide = index !== null ? slides[index] : null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      const next = Math.min(slides.length - 1, Math.max(0, index + delta));
      if (next !== index) onIndexChange(next);
    },
    [index, slides.length, onIndexChange],
  );

  useEffect(() => {
    setZoom(100);
    setOffset({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
    else if (event.key === '-') setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await container.current?.requestFullscreen?.();
  }

  function onPointerDown(event: React.PointerEvent) {
    if (zoom <= 100) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!drag.current) return;
    setOffset({ x: drag.current.ox + event.clientX - drag.current.x, y: drag.current.oy + event.clientY - drag.current.y });
  }

  const changeZoom = (delta: number) => {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta));
      if (next <= 100) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-[lightbox-in_180ms_ease-out]" />
        <Dialog.Content
          ref={container}
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-overlay text-white outline-none data-[state=open]:animate-[lightbox-in_180ms_ease-out]"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">
            Response {responseLabel}, slide {(index ?? 0) + 1} of {slides.length}
          </Dialog.Title>
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg bg-black/40 p-1">
            <button type="button" className={toolButton} onClick={() => changeZoom(-ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-[13px] tabular-nums" aria-live="polite">
              {zoom}%
            </span>
            <button type="button" className={toolButton} onClick={() => changeZoom(ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button type="button" className={toolButton} onClick={() => setShowThumbs((s) => !s)} aria-pressed={showThumbs} aria-label="Show thumbnails">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" className={toolButton} onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
            <Dialog.Close className={toolButton} aria-label="Close">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div
            className={cn('relative flex flex-1 items-center justify-center overflow-hidden', zoom > 100 ? 'cursor-grab active:cursor-grabbing' : '')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) changeZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
            }}
          >
            {slide && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={zoom > 100 ? slide.originalUrl : slide.url}
                alt={`Response ${responseLabel}, slide ${(index ?? 0) + 1}`}
                draggable={false}
                className="max-h-[82vh] max-w-[92vw] object-contain select-none"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom / 100})`, transition: drag.current ? 'none' : 'transform 150ms ease-out' }}
              />
            )}
            <button
              type="button"
              className="absolute top-1/2 left-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30"
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30"
              onClick={() => go(1)}
              disabled={index === slides.length - 1}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-black/40 px-3 py-1.5 text-sm font-medium">
            Response {responseLabel} · Slide {(index ?? 0) + 1}/{slides.length}
          </div>

          {showThumbs && (
            <div className="absolute bottom-4 left-1/2 flex max-w-[70vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-lg bg-black/50 p-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  className={cn('h-14 shrink-0 overflow-hidden rounded-sm border-2', i === index ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100')}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" className="h-full w-auto" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
