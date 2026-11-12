'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, Check, Copy, Eye, Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectDTO, RubricFieldDef, TagDTO, TaskDetailDTO, UserDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { PriorityBadge, ResponseChip, StatusBadge } from '../ui/badges';
import { Card } from '../ui/card';
import { useConfirm } from '../ui/dialog-provider';
import { FileChip } from '../ui/file-chip';
import { Input, Label } from '../ui/form';
import { RubricRenderer } from '../workspace/rubric-renderer';
import { BasicsForm, basicsFromTask } from './basics-form';
import { Dropzone } from './dropzone';
import { RichTextEditor } from './rich-text-editor';
import { SlideBoard, SlideGrid } from './slide-board';
import { useDeleteTask } from './use-delete-task';

const STEPS = ['Basics', 'Brief', 'Input files', 'Responses', 'Rubric & assignment'];
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const DOC_ACCEPT = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,image/png,image/jpeg,image/webp';

async function attempt<T>(action: () => Promise<T>, success?: string): Promise<T | undefined> {
  try {
    const result = await action();
    if (success) toast.success(success);
    return result;
  } catch (err) {
    toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    return undefined;
  }
}

export function TaskBuilder({
  initialTask,
  projects,
  tags,
  raters,
  fields,
}: {
  initialTask: TaskDetailDTO;
  projects: ProjectDTO[];
  tags: TagDTO[];
  raters: UserDTO[];
  fields: RubricFieldDef[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const pathname = usePathname();
  const params = useSearchParams();
  const step = Math.min(STEPS.length, Math.max(1, Number(params.get('step') ?? 1)));
  const [task, setTask] = useState(initialTask);
  const deleteTask = useDeleteTask();
  const base = `/admin/tasks/${task.id}`;

  const goTo = (n: number) => router.replace(`${pathname}?step=${n}`, { scroll: false });

  async function setStatus(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    const updated = await attempt(() => api.put<TaskDetailDTO>(`${base}/status`, { status }), status === 'PUBLISHED' ? 'Published' : 'Saved');
    if (updated) setTask(updated);
  }

  async function duplicate() {
    const copy = await attempt(() => api.post<TaskDetailDTO>(`${base}/duplicate`), 'Task duplicated');
    if (copy) router.push(`/admin/tasks/${copy.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <h1 className="text-title font-medium">{task.title}</h1>
          <p className="mt-1 text-meta text-fg-muted">
            {task.projectName} · {task.responses.length} responses · {task.submissionCount} {task.submissionCount === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}/preview`} className="inline-flex h-10 items-center gap-2 rounded-sm bg-surface px-4 text-sm font-medium shadow-[inset_0_0_0_1.5px_var(--ink)] transition hover:-translate-y-px">
            <Eye className="h-4 w-4" aria-hidden /> Preview as rater
          </Link>
          <Button variant="secondary" onClick={duplicate}>
            <Copy className="h-4 w-4" aria-hidden /> Duplicate
          </Button>
          <Button variant="ghost" onClick={() => void deleteTask(task)} aria-label="Delete task" title="Delete task">
            <Trash2 className="h-4 w-4" />
          </Button>
          {task.status !== 'ARCHIVED' && task.status !== 'DRAFT' && (
            <Button variant="ghost" onClick={() => setStatus('ARCHIVED')}>
              <Archive className="h-4 w-4" aria-hidden /> Archive
            </Button>
          )}
          {task.status === 'DRAFT' || task.status === 'ARCHIVED' ? (
            <Button variant="yellow" onClick={() => setStatus('PUBLISHED')}>
              <Send className="h-4 w-4" aria-hidden /> Publish
            </Button>
          ) : (
            task.submissionCount === 0 && (
              <Button variant="secondary" onClick={() => setStatus('DRAFT')}>
                Back to draft
              </Button>
            )
          )}
        </div>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Builder steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const current = n === step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => goTo(n)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-sm border px-3 text-sm',
                  current ? 'border-fg bg-fg font-medium text-page' : 'border-border-strong bg-surface text-fg hover:bg-subtle',
                )}
              >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[12px] font-bold', current ? 'bg-yellow text-cocoa' : 'bg-muted')}>
                  {n < step ? <Check className="h-3 w-3" /> : n}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      <Card className="p-6">
        {step === 1 && (
          <BasicsForm
            initial={basicsFromTask(task, projects)}
            projects={projects}
            tags={tags}
            submitLabel="Save and continue"
            onSubmit={async (payload) => {
              setTask(await api.put<TaskDetailDTO>(`${base}/basics`, payload));
              toast.success('Saved');
              goTo(2);
            }}
          />
        )}
        {step === 2 && <BriefStep task={task} onSaved={(t) => { setTask(t); goTo(3); }} />}
        {step === 3 && (
          <div className="space-y-4">
            <Dropzone<TaskDetailDTO>
              url={`${base}/input-files`}
              accept={DOC_ACCEPT}
              label="Drop input files here, or click to choose"
              hint=".docx, .xlsx, .pdf, .pptx or images · up to 25MB each"
              onUploaded={setTask}
            />
            <div className="flex flex-wrap gap-2">
              {task.inputFiles.map((file) => (
                <FileChip
                  key={file.id}
                  file={file}
                  onRemove={async () => {
                    const updated = await attempt(() => api.delete<TaskDetailDTO>(`${base}/input-files/${file.id}`));
                    if (updated) setTask(updated);
                  }}
                />
              ))}
              {task.inputFiles.length === 0 && <p className="text-sm text-fg-muted">No input files yet. This step is optional.</p>}
            </div>
            <Button onClick={() => goTo(4)}>Continue</Button>
          </div>
        )}
        {step === 4 && (
          <SlideBoard task={task} onTask={setTask}>
            <div className="space-y-8">
              {task.responses.length > 1 && (
                <p className="text-sm text-fg-muted">
                  Drag a slide by its handle to reorder it or move it to another response. To move many at once, tick their boxes (shift-click selects a range) and choose Move to.
                </p>
              )}
              {task.responses.map((response) => (
                <section key={response.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-section font-medium">
                      <ResponseChip label={response.label} /> Response {response.label}
                      <span className="text-meta font-normal text-fg-muted">{response.slides.length} slides</span>
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={task.submissionCount > 0}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Remove Response ${response.label}?`,
                          description: 'Its slides and files are deleted, and the responses after it are relabelled.',
                          confirmLabel: 'Remove response',
                          destructive: true,
                        });
                        if (!ok) return;
                        const updated = await attempt(() => api.delete<TaskDetailDTO>(`${base}/responses/${response.id}`));
                        if (updated) setTask(updated);
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden /> Remove
                    </Button>
                  </div>
                  <Dropzone<TaskDetailDTO>
                    url={`${base}/responses/${response.id}/slides`}
                    accept={IMAGE_ACCEPT}
                    label={`Drop slide images for Response ${response.label}`}
                    hint="PNG, JPG or WebP · sorted by filename number (slide2 before slide10)"
                    onUploaded={setTask}
                    compact={response.slides.length > 0}
                  />
                  <SlideGrid response={response} />
                  <div className="flex flex-wrap items-center gap-2">
                    {response.files.map((file) => (
                      <FileChip
                        key={file.id}
                        file={file}
                        onRemove={async () => {
                          const updated = await attempt(() => api.delete<TaskDetailDTO>(`${base}/response-files/${file.id}`));
                          if (updated) setTask(updated);
                        }}
                      />
                    ))}
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-fg-muted hover:text-fg">Attach a downloadable file (.pptx or .pdf)</summary>
                    <div className="mt-2">
                      <Dropzone<TaskDetailDTO>
                        url={`${base}/responses/${response.id}/files`}
                        accept=".pptx,.pdf"
                        label="Drop a .pptx or .pdf"
                        hint="Raters can download it from the response tab"
                        onUploaded={setTask}
                        compact
                      />
                    </div>
                  </details>
                </section>
              ))}
              <div className="flex gap-2">
                {task.responses.length < 4 && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const updated = await attempt(() => api.post<TaskDetailDTO>(`${base}/responses`));
                      if (updated) setTask(updated);
                    }}
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add response
                  </Button>
                )}
                <Button onClick={() => goTo(5)}>Continue</Button>
              </div>
            </div>
          </SlideBoard>
        )}
        {step === 5 && <AssignmentStep task={task} raters={raters} fields={fields} onSaved={setTask} />}
      </Card>

    </div>
  );
}

function BriefStep({ task, onSaved }: { task: TaskDetailDTO; onSaved: (task: TaskDetailDTO) => void }) {
  const [instructions, setInstructions] = useState(task.instructions);
  const [userRequest, setUserRequest] = useState(task.userRequest);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <Label>Instructions</Label>
        <RichTextEditor value={instructions} onChange={setInstructions} label="Instructions" />
        <p className="mt-1 text-meta text-fg-muted">Include &quot;rate each response independently&quot; to turn on the comparison warning for raters.</p>
      </div>
      <div>
        <Label>User request</Label>
        <RichTextEditor value={userRequest} onChange={setUserRequest} label="User request" />
      </div>
      <Button
        loading={busy}
        onClick={async () => {
          setBusy(true);
          const updated = await attempt(() => api.put<TaskDetailDTO>(`/admin/tasks/${task.id}/brief`, { instructions, userRequest }), 'Saved');
          setBusy(false);
          if (updated) onSaved(updated);
        }}
      >
        Save and continue
      </Button>
    </div>
  );
}

function AssignmentStep({
  task,
  raters,
  fields,
  onSaved,
}: {
  task: TaskDetailDTO;
  raters: UserDTO[];
  fields: RubricFieldDef[];
  onSaved: (task: TaskDetailDTO) => void;
}) {
  const [openQueue, setOpenQueue] = useState(task.openQueue);
  const [assigneeIds, setAssigneeIds] = useState(task.assigneeIds);
  const [ratersNeeded, setRatersNeeded] = useState(task.ratersNeeded);
  const [busy, setBusy] = useState(false);
  const [previewTab, setPreviewTab] = useState<string | null>(task.responses[0]?.id ?? null);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <h2 className="text-section font-medium">Assignment</h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Who can pick this up</legend>
          <label className="flex items-start gap-2.5">
            <input type="radio" name="queue" className="mt-1 accent-[var(--primary)]" checked={openQueue} onChange={() => setOpenQueue(true)} />
            <span>
              <span className="font-medium">Open queue</span>
              <span className="block text-meta text-fg-muted">Any rater can claim it until it has enough raters. Raters picked below always see it.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5">
            <input type="radio" name="queue" className="mt-1 accent-[var(--primary)]" checked={!openQueue} onChange={() => setOpenQueue(false)} />
            <span>
              <span className="font-medium">Specific raters only</span>
              <span className="block text-meta text-fg-muted">Only the raters picked below can see it.</span>
            </span>
          </label>
        </fieldset>
        <div className="w-40">
          <Label htmlFor="ratersNeeded">Raters needed</Label>
          <Input id="ratersNeeded" type="number" min={1} max={50} value={ratersNeeded} onChange={(e) => setRatersNeeded(Number(e.target.value))} />
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Assigned raters</legend>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2">
            {raters.length === 0 && <p className="p-2 text-sm text-fg-muted">No raters yet. Invite some from Users.</p>}
            {raters.map((rater) => (
              <label key={rater.id} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-subtle">
                <input
                  type="checkbox"
                  className="accent-[var(--primary)]"
                  checked={assigneeIds.includes(rater.id)}
                  onChange={(e) => setAssigneeIds(e.target.checked ? [...assigneeIds, rater.id] : assigneeIds.filter((id) => id !== rater.id))}
                />
                {rater.name ?? rater.email}
                <span className="text-meta text-fg-subtle">{rater.email}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const updated = await attempt(() => api.put<TaskDetailDTO>(`/admin/tasks/${task.id}/assignment`, { openQueue, assigneeIds, ratersNeeded }), 'Assignment saved');
            setBusy(false);
            if (updated) onSaved(updated);
          }}
        >
          Save assignment
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-section font-medium">Rubric</h2>
        <p className="text-meta text-fg-muted">This task uses the project&apos;s rubric. Edit rubrics under Rubrics.</p>
        <div className="flex flex-wrap gap-1">
          {task.responses.map((r) => (
            <Button key={r.id} size="sm" variant={previewTab === r.id ? 'primary' : 'secondary'} onClick={() => setPreviewTab(r.id)}>
              Response {r.label}
            </Button>
          ))}
          <Button size="sm" variant={previewTab === null ? 'primary' : 'secondary'} onClick={() => setPreviewTab(null)}>
            Ranking
          </Button>
        </div>
        <div className="max-h-[560px] overflow-y-auto rounded-lg border border-border bg-subtle p-4">
          <RubricRenderer fields={fields} responseId={previewTab} responses={task.responses} answers={{}} onChange={() => undefined} readOnly comments={[]} />
        </div>
      </div>
    </div>
  );
}
