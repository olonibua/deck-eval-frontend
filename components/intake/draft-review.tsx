'use client';

import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { RESPONSE_LABELS, responseLabelsIn, type DraftFileRole, type IntakeFileDTO, type ProjectDTO, type ResponseLabel, type TagDTO, type TaskDraft } from '@/lib/shared';
import { RichTextEditor } from '../admin/rich-text-editor';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input, Label, Select } from '../ui/form';

interface Props {
  draft: TaskDraft;
  version: number;
  files: IntakeFileDTO[];
  projects: ProjectDTO[];
  tags: TagDTO[];
  creating: boolean;
  onChange: (draft: TaskDraft) => void;
  onCreate: () => void;
}

const ROLE_LABELS: Record<DraftFileRole, string> = { response: 'Response', combined: 'All responses', input: 'Input file', ignore: 'Leave out' };

function FileRoles({ draft, files, onChange }: Pick<Props, 'draft' | 'files' | 'onChange'>) {
  const byId = new Map(files.map((f) => [f.id, f]));
  const rows = draft.files.filter((f) => byId.has(f.fileId));
  if (rows.length === 0) return <p className="text-sm text-fg-muted">No files attached.</p>;

  const replace = (fileId: string, next: (typeof draft.files)[number]) => onChange({ ...draft, files: draft.files.map((f) => (f.fileId === fileId ? next : f)) });
  const update = (fileId: string, role: DraftFileRole, label: ResponseLabel | null) =>
    replace(fileId, role === 'combined' ? { fileId, role, label: null, labels: [...RESPONSE_LABELS] } : { fileId, role, label: role === 'response' ? label ?? 'A' : null });
  const toggleLabel = (fileId: string, labels: ResponseLabel[], label: ResponseLabel) => {
    const next = labels.includes(label) ? labels.filter((l) => l !== label) : RESPONSE_LABELS.filter((l) => l === label || labels.includes(l));
    replace(fileId, { fileId, role: 'combined', label: null, labels: next });
  };

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {rows.map((row) => {
        const file = byId.get(row.fileId)!;
        const canBeResponse = file.pageCount > 0;
        return (
          <li key={row.fileId} className="flex flex-wrap items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-subtle">
              {file.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.thumbnailUrl} alt="" className="h-full w-full object-cover object-top" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-[12px] text-fg-muted">{file.pageCount ? `${file.pageCount} ${file.pageCount === 1 ? 'page' : 'pages'}` : 'Text only'}</p>
            </div>
            <Select
              aria-label={`Role for ${file.name}`}
              value={row.role}
              onChange={(e) => update(row.fileId, e.target.value as DraftFileRole, row.label)}
              className="h-9 w-48 text-sm"
            >
              {(Object.keys(ROLE_LABELS) as DraftFileRole[]).map((role) => (
                <option key={role} value={role} disabled={(role === 'response' || role === 'combined') && !canBeResponse}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
            {row.role === 'combined' && (
              <div className="basis-full pl-[68px]">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Responses in ${file.name}`}>
                  {RESPONSE_LABELS.map((label) => {
                    const on = row.labels?.includes(label) ?? false;
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleLabel(row.fileId, row.labels ?? [], label)}
                        className={on ? 'h-7 w-8 rounded-sm bg-fg text-[13px] font-semibold text-page' : 'h-7 w-8 rounded-sm border border-border-strong text-[13px] text-fg-muted'}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[12px] text-fg-muted">
                  Creates an empty placeholder for each selected response, with this file attached to each one. Upload the slide images per response after you create the task.
                </p>
              </div>
            )}
            {row.role === 'response' && (
              <Select
                aria-label={`Response for ${file.name}`}
                value={row.label ?? 'A'}
                onChange={(e) => update(row.fileId, 'response', e.target.value as ResponseLabel)}
                className="h-9 w-20 text-sm"
              >
                {RESPONSE_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TagInput({ value, tags, onChange }: { value: string[]; tags: TagDTO[]; onChange: (names: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const name = text.trim();
    if (name && !value.some((v) => v.toLowerCase() === name.toLowerCase())) onChange([...value, name]);
    setText('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((name) => (
          <span key={name} className="inline-flex items-center gap-1 rounded-pill bg-muted px-2.5 py-1 text-[13px]">
            {name}
            <button type="button" aria-label={`Remove tag ${name}`} onClick={() => onChange(value.filter((v) => v !== name))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        list="intake-tags"
        value={text}
        placeholder="Add a tag and press Enter"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className="mt-2 h-9 text-sm"
      />
      <datalist id="intake-tags">
        {tags.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
    </div>
  );
}

export function DraftReview({ draft, version, files, projects, tags, creating, onChange, onCreate }: Props) {
  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => onChange({ ...draft, [key]: value });
  const used = new Set(draft.files.filter((f) => f.role !== 'ignore').map((f) => f.fileId));
  const notReady = files.filter((f) => used.has(f.id) && f.status !== 'ready');
  const inputs = draft.files.filter((f) => f.role === 'input').length;
  const responses = responseLabelsIn(draft.files).length;
  const blocker = !draft.title.trim() ? 'Add a title' : notReady.length ? 'Wait for files to finish reading' : null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="stamp mb-1">Draft task</p>
          <p className="text-sm text-fg-muted">Check everything here. It is saved as a draft, so nothing goes to raters yet.</p>
        </div>
      </div>

      {draft.notes && (
        <div className="mb-5 flex gap-2 rounded-md bg-yellow/40 px-3 py-2.5 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{draft.notes}</p>
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <Label htmlFor="draft-title">Title</Label>
          <Input id="draft-title" value={draft.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="draft-project">Project</Label>
            <Select id="draft-project" value={draft.projectId} onChange={(e) => set('projectId', e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="draft-priority">Priority</Label>
            <Select id="draft-priority" value={draft.priority} onChange={(e) => set('priority', Number(e.target.value))}>
              <option value={1}>P1 · High</option>
              <option value={2}>P2 · Normal</option>
              <option value={3}>P3 · Low</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="draft-due">Due date</Label>
            <Input id="draft-due" type="date" value={draft.dueAt ?? ''} onChange={(e) => set('dueAt', e.target.value || null)} />
          </div>
          <div>
            <Label htmlFor="draft-raters">Raters needed</Label>
            <Input
              id="draft-raters"
              type="number"
              min={1}
              max={50}
              value={draft.ratersNeeded}
              onChange={(e) => set('ratersNeeded', Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>
        <div>
          <Label>Tags</Label>
          <TagInput value={draft.tagNames} tags={tags} onChange={(names) => set('tagNames', names)} />
        </div>
        <div>
          <Label>Instructions for raters</Label>
          <RichTextEditor key={`instructions-${version}`} label="Instructions" value={draft.instructionsHtml} onChange={(html) => set('instructionsHtml', html)} />
        </div>
        <div>
          <Label>User request</Label>
          <RichTextEditor key={`request-${version}`} label="User request" value={draft.userRequestHtml} onChange={(html) => set('userRequestHtml', html)} />
        </div>
        <div>
          <Label>Files</Label>
          <FileRoles draft={draft} files={files} onChange={onChange} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
        <p className="mr-auto text-sm text-fg-muted">
          {responses} {responses === 1 ? 'response' : 'responses'} · {inputs} {inputs === 1 ? 'input file' : 'input files'}
        </p>
        {blocker && <p className="text-sm text-danger">{blocker}</p>}
        <Button variant="yellow" loading={creating} disabled={!!blocker} onClick={onCreate}>
          Create draft task
        </Button>
      </div>
    </Card>
  );
}
