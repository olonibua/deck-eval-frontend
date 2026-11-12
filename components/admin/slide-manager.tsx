'use client';

import { useEffect, useRef, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ResponseDTO, SlideDTO, TaskDetailDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { useConfirm } from '../ui/dialog-provider';

function SortableSlide({
  slide,
  index,
  taskId,
  onTask,
}: {
  slide: SlideDTO;
  index: number;
  taskId: string;
  onTask: (task: TaskDetailDTO) => void;
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
      className={cn('group rounded-md border border-border bg-surface p-1.5', isDragging && 'z-10 shadow-pop')}
    >
      <div className="relative aspect-video overflow-hidden rounded-sm bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.url} alt={`Slide ${index + 1}`} className="h-full w-full object-contain" loading="lazy" />
        <button
          type="button"
          className="absolute top-1 left-1 inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-sm bg-surface/90 text-fg-muted shadow-card active:cursor-grabbing"
          aria-label={`Drag slide ${index + 1} to reorder`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
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

export function SlideManager({ taskId, response, onTask }: { taskId: string; response: ResponseDTO; onTask: (task: TaskDetailDTO) => void }) {
  const [slides, setSlides] = useState(response.slides);
  useEffect(() => setSlides(response.slides), [response.slides]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = arrayMove(slides, slides.findIndex((s) => s.id === active.id), slides.findIndex((s) => s.id === over.id));
    setSlides(next);
    try {
      onTask(await api.put<TaskDetailDTO>(`/admin/tasks/${taskId}/responses/${response.id}/slides/order`, { slideIds: next.map((s) => s.id) }));
    } catch (err) {
      setSlides(response.slides);
      toast.error(err instanceof ApiError ? err.message : 'Could not reorder');
    }
  }

  if (slides.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slides.map((slide, index) => (
            <SortableSlide key={slide.id} slide={slide} index={index} taskId={taskId} onTask={onTask} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
