'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ResponseDTO, SlideDTO, TaskDetailDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Select } from '../ui/form';
import { SlideTile, SortableSlide } from './sortable-slide';

type Lists = Record<string, SlideDTO[]>;

interface BoardApi {
  taskId: string;
  lists: Lists;
  dragging: boolean;
  locked: boolean;
  selected: Set<string>;
  toggle: (responseId: string, slideId: string, range: boolean) => void;
  onTask: (task: TaskDetailDTO) => void;
}

const BoardContext = createContext<BoardApi | null>(null);

function useBoard(): BoardApi {
  const board = useContext(BoardContext);
  if (!board) throw new Error('SlideGrid must sit inside SlideBoard');
  return board;
}

const listsOf = (responses: ResponseDTO[]): Lists => Object.fromEntries(responses.map((r) => [r.id, r.slides]));

export function SlideBoard({ task, onTask, children }: { task: TaskDetailDTO; onTask: (task: TaskDetailDTO) => void; children: React.ReactNode }) {
  const [lists, setLists] = useState<Lists>(() => listsOf(task.responses));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState('');
  const [moving, setMoving] = useState(false);
  const origin = useRef<string | null>(null);
  const anchor = useRef<string | null>(null);
  const locked = task.submissionCount > 0;

  useEffect(() => {
    setLists(listsOf(task.responses));
    const ids = new Set(task.responses.flatMap((r) => r.slides.map((s) => s.id)));
    setSelected((current) => new Set([...current].filter((id) => ids.has(id))));
  }, [task.responses]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const containerOf = (id: string): string | null => (id in lists ? id : Object.keys(lists).find((key) => lists[key].some((s) => s.id === id)) ?? null);
  const activeSlide = activeId ? Object.values(lists).flat().find((s) => s.id === activeId) ?? null : null;

  async function save(request: () => Promise<TaskDetailDTO>, failure: string) {
    try {
      onTask(await request());
    } catch (err) {
      setLists(listsOf(task.responses));
      toast.error(err instanceof ApiError ? err.message : failure);
    }
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    origin.current = containerOf(String(active.id));
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || locked) return;
    const from = containerOf(String(active.id));
    const to = containerOf(String(over.id));
    if (!from || !to || from === to) return;
    setLists((current) => {
      const slide = current[from].find((s) => s.id === active.id);
      if (!slide) return current;
      const overIndex = current[to].findIndex((s) => s.id === over.id);
      const index = overIndex < 0 ? current[to].length : overIndex;
      return {
        ...current,
        [from]: current[from].filter((s) => s.id !== active.id),
        [to]: [...current[to].slice(0, index), slide, ...current[to].slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const id = String(active.id);
    const to = containerOf(id);
    const from = origin.current;
    origin.current = null;
    if (!over || !to || !from) return setLists(listsOf(task.responses));

    let list = lists[to];
    const overIndex = list.findIndex((s) => s.id === over.id);
    if (overIndex >= 0 && over.id !== active.id) list = arrayMove(list, list.findIndex((s) => s.id === id), overIndex);
    setLists((current) => ({ ...current, [to]: list }));

    if (from !== to) {
      void save(() => api.put<TaskDetailDTO>(`/admin/tasks/${task.id}/slides/move`, { slideIds: [id], responseId: to, index: list.findIndex((s) => s.id === id) }), 'Could not move the slide');
    } else if (list.map((s) => s.id).join() !== task.responses.find((r) => r.id === to)?.slides.map((s) => s.id).join()) {
      void save(() => api.put<TaskDetailDTO>(`/admin/tasks/${task.id}/responses/${to}/slides/order`, { slideIds: list.map((s) => s.id) }), 'Could not reorder');
    }
  }

  function toggle(responseId: string, slideId: string, range: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      const list = lists[responseId];
      const from = anchor.current ? list.findIndex((s) => s.id === anchor.current) : -1;
      if (range && from >= 0) {
        const to = list.findIndex((s) => s.id === slideId);
        for (const slide of list.slice(Math.min(from, to), Math.max(from, to) + 1)) next.add(slide.id);
      } else if (next.has(slideId)) {
        next.delete(slideId);
      } else {
        next.add(slideId);
      }
      anchor.current = slideId;
      return next;
    });
  }

  async function moveSelected() {
    if (!target) return;
    const slideIds = task.responses.flatMap((r) => lists[r.id] ?? []).filter((s) => selected.has(s.id)).map((s) => s.id);
    setMoving(true);
    await save(() => api.put<TaskDetailDTO>(`/admin/tasks/${task.id}/slides/move`, { slideIds, responseId: target }), 'Could not move the slides');
    setMoving(false);
    setSelected(new Set());
    anchor.current = null;
  }

  const board = useMemo<BoardApi>(
    () => ({ taskId: task.id, lists, dragging: activeId !== null, locked, selected, toggle, onTask }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task.id, lists, activeId, locked, selected, onTask],
  );

  return (
    <BoardContext.Provider value={board}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => setLists(listsOf(task.responses))}>
        {children}
        <DragOverlay>{activeSlide && <SlideTile slide={activeSlide} label="Moving" overlay />}</DragOverlay>
      </DndContext>
      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-pop">
          <span className="text-sm font-medium">
            {selected.size} {selected.size === 1 ? 'slide' : 'slides'} selected
          </span>
          <span className="text-[12px] text-fg-muted">Shift-click to select a range</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Select aria-label="Move selected slides to" value={target} onChange={(e) => setTarget(e.target.value)} className="h-9 w-44 text-sm">
              <option value="">Move to…</option>
              {task.responses.map((r) => (
                <option key={r.id} value={r.id}>
                  Response {r.label}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={moveSelected} loading={moving} disabled={!target || locked}>
              Move <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} aria-label="Clear selection">
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </BoardContext.Provider>
  );
}

export function SlideGrid({ response }: { response: ResponseDTO }) {
  const { taskId, lists, dragging, locked, selected, toggle, onTask } = useBoard();
  const slides = lists[response.id] ?? [];
  const { setNodeRef, isOver } = useDroppable({ id: response.id, disabled: locked });

  if (slides.length === 0 && !dragging) return null;

  return (
    <SortableContext id={response.id} items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
      <ul
        ref={setNodeRef}
        className={cn(
          'grid min-h-24 grid-cols-2 gap-3 rounded-md sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
          dragging && 'p-2 outline-2 -outline-offset-2 outline-dashed outline-border-strong',
          isOver && 'bg-primary-soft outline-primary',
        )}
      >
        {slides.map((slide, index) => (
          <SortableSlide
            key={slide.id}
            slide={slide}
            index={index}
            taskId={taskId}
            onTask={onTask}
            selected={selected.has(slide.id)}
            selecting={selected.size > 0}
            onSelect={(range) => toggle(response.id, slide.id, range)}
          />
        ))}
        {slides.length === 0 && <li className="col-span-full flex items-center justify-center text-sm text-fg-muted">Drop here to move into Response {response.label}</li>}
      </ul>
    </SortableContext>
  );
}
