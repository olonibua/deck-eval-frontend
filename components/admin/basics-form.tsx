'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { ProjectDTO, TagDTO, TaskDetailDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { FieldError, Input, Label, Select } from '../ui/form';

export interface BasicsValues {
  title: string;
  projectId: string;
  priority: number;
  tagIds: string[];
  dueAt: string;
  ratersNeeded: number;
}

const TAG_COLORS = ['#4176C5', '#EC905D', '#C4597C', '#8FD1DC', '#F3B2AF', '#DCE88C', '#8DD0FB', '#F8E87D'];

export function basicsFromTask(task?: TaskDetailDTO, projects: ProjectDTO[] = []): BasicsValues {
  return {
    title: task?.title ?? '',
    projectId: task?.projectId ?? projects[0]?.id ?? '',
    priority: task?.priority ?? 2,
    tagIds: task?.tags.map((t) => t.id) ?? [],
    dueAt: task?.dueAt ? task.dueAt.slice(0, 10) : '',
    ratersNeeded: task?.ratersNeeded ?? 1,
  };
}

export function BasicsForm({
  initial,
  projects,
  tags: initialTags,
  submitLabel,
  onSubmit,
}: {
  initial: BasicsValues;
  projects: ProjectDTO[];
  tags: TagDTO[];
  submitLabel: string;
  onSubmit: (payload: Omit<BasicsValues, 'dueAt'> & { dueAt: string | null }) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof BasicsValues>(key: K, value: BasicsValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  function toggleTag(id: string) {
    set('tagIds', values.tagIds.includes(id) ? values.tagIds.filter((t) => t !== id) : [...values.tagIds, id]);
  }

  async function createTag() {
    const name = newTag.trim();
    if (!name) return;
    const tag = await api.post<TagDTO>('/tags', { name, color: TAG_COLORS[tags.length % TAG_COLORS.length] });
    setTags((current) => (current.some((t) => t.id === tag.id) ? current : [...current, tag]));
    set('tagIds', [...new Set([...values.tagIds, tag.id])]);
    setNewTag('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ ...values, dueAt: values.dueAt ? new Date(`${values.dueAt}T23:59:00Z`).toISOString() : null });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={values.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="project">Project</Label>
          <Select id="project" value={values.projectId} onChange={(e) => set('projectId', e.target.value)} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" value={values.priority} onChange={(e) => set('priority', Number(e.target.value))}>
            <option value={1}>P1 · High</option>
            <option value={2}>P2 · Normal</option>
            <option value={3}>P3 · Low</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="due">Due date</Label>
          <Input id="due" type="date" value={values.dueAt} onChange={(e) => set('dueAt', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="raters">Raters needed</Label>
          <Input id="raters" type="number" min={1} max={50} value={values.ratersNeeded} onChange={(e) => set('ratersNeeded', Number(e.target.value))} />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const selected = values.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[13px] font-medium',
                  selected ? 'border-primary bg-primary-soft text-fg' : 'border-border-strong text-fg-muted hover:bg-subtle',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: tag.color }} aria-hidden />
                {tag.name}
              </button>
            );
          })}
          <span className="inline-flex items-center gap-1">
            <Input
              className="h-8 w-36 text-sm"
              placeholder="New tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void createTag();
                }
              }}
              aria-label="New tag name"
            />
            <Button size="icon" variant="secondary" onClick={createTag} aria-label="Create tag">
              <Plus className="h-4 w-4" />
            </Button>
          </span>
        </div>
      </fieldset>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
