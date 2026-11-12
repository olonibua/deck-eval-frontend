'use client';

import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SlideDTO, TaskDetailDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { useConfirm } from '../ui/dialog-provider';

export function SlideTile({ slide, label, overlay = false }: { slide: SlideDTO; label: string; overlay?: boolean }) {
  return (
    <div className={cn('rounded-md border border-border bg-surface p-1.5', overlay && 'w-48 rotate-2 shadow-pop')}>
      <div className="aspect-video overflow-hidden rounded-sm bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.url} alt="" className="h-full w-full object-contain" />
      </div>
      <p className="mt-1.5 px-0.5 text-meta font-semibold">{label}</p>
    </div>
  );
}

export function SortableSlide({
  slide,
  index,
  taskId,
  onTask,
  selected,
  selecting,
  onSelect,
}: {
  slide: SlideDTO;
  index: number;
  taskId: string;
  onTask: (task: TaskDetailDTO) => void;
  selected: boolean;
  selecting: boolean;
  onSelect: (range: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const confirm = useConfirm();
  const [caption, setCaption] = useState(slide.caption ?? '');
  const replaceInput = useRef<HTMLInputElement>(null);

  useEffect(() => setCaption(slide.caption ?? ''), [slide.caption]);

  async function run(action: () => Promise<TaskDetailDTO>) {
    try {
      onTask(await action());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  async function replace(file: File) {
    const form = new FormData();
    form.append('file', file);
    await run(() => api.put<TaskDetailDTO>(`/admin/tasks/${taskId}/slides/${slide.id}/image`, form));
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group rounded-md border bg-surface p-1.5', selected ? 'border-fg ring-2 ring-fg' : 'border-border', isDragging && 'opacity-40')}
    >
      <div className="relative aspect-video overflow-hidden rounded-sm bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.url}
          alt={`Slide ${index + 1}`}
          className={cn('h-full w-full object-contain', selecting && 'cursor-pointer')}
          loading="lazy"
          onClick={(e) => selecting && onSelect(e.shiftKey)}
        />
        <button
          type="button"
          className="absolute top-1 left-1 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-sm bg-surface/90 text-fg-muted shadow-card active:cursor-grabbing"
          aria-label={`Drag slide ${index + 1} to reorder or move to another response`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select slide ${index + 1}`}
          onClick={(e) => onSelect(e.shiftKey)}
          className={cn(
            'absolute bottom-1 left-1 inline-flex h-6 w-6 items-center justify-center rounded-sm border-[1.5px] shadow-card transition-opacity',
            selected ? 'border-fg bg-fg text-page' : 'border-border-strong bg-surface/90 text-transparent',
            selected || selecting ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-surface/90 text-fg-muted shadow-card hover:text-fg"
            aria-label={`Replace slide ${index + 1}`}
            onClick={() => replaceInput.current?.click()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-surface/90 text-fg-muted shadow-card hover:text-danger"
            aria-label={`Delete slide ${index + 1}`}
            onClick={async () => {
              const ok = await confirm({
                title: `Delete slide ${index + 1}?`,
                description: 'The image is removed and the slides after it move up.',
                confirmLabel: 'Delete slide',
                destructive: true,
              });
              if (ok) void run(() => api.delete<TaskDetailDTO>(`/admin/tasks/${taskId}/slides/${slide.id}`));
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          ref={replaceInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void replace(file);
            e.target.value = '';
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 px-0.5">
        <span className="text-meta font-semibold whitespace-nowrap">Slide {index + 1}</span>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            if (caption !== (slide.caption ?? '')) void run(() => api.patch<TaskDetailDTO>(`/admin/tasks/${taskId}/slides/${slide.id}`, { caption: caption || null }));
          }}
          placeholder="Caption"
          aria-label={`Caption for slide ${index + 1}`}
          className="min-w-0 flex-1 rounded-sm border border-transparent bg-transparent px-1 text-meta hover:border-border focus:border-border-strong"
        />
      </div>
    </li>
  );
}
