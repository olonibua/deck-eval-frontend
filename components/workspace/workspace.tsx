'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Flag, Info, Lightbulb, Sparkles, Undo2, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  answerKey,
  completionState,
  needsIndependenceCheck,
  progressFor,
  validateAnswers,
  type AnswerMap,
  type AnswerValue,
  type FieldIssue,
  type ReviewCommentDTO,
  type RubricFieldDef,
  type WorkspaceDTO,
} from '@/lib/shared';
import { restorePending, useAutosave } from '@/hooks/use-autosave';
import { useActiveTimer } from '@/hooks/use-active-timer';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { formatDuration } from '@/lib/format';
import { Button } from '../ui/button';
import { PriorityBadge, ResponseChip, StatusBadge } from '../ui/badges';
import { ConfirmDialog } from '../ui/confirm';
import { Dialog, DialogClose, DialogContent, Sheet } from '../ui/dialog';
import { FileChip } from '../ui/file-chip';
import { Textarea } from '../ui/form';
import { BriefCard } from './brief-card';
import type { CommentDraft } from './field-comment-button';
import { ReviewFooter } from './review-footer';
import { fieldDomId, RubricRenderer, type CommentHandlers } from './rubric-renderer';
import { SaveIndicator } from './save-indicator';
import { SegmentedTabs, type TabItem } from './segmented-tabs';
import { SlideCard } from './slide-card';
import { SlideLightbox } from './slide-lightbox';
import { HumaniseAllMenu, HumaniseTools } from './humanise-tools';
import { HUMANISE_MODES } from '@/lib/shared';
import { MODE_LABELS, useHumanise } from './use-humanise';
import { useQc } from './use-qc';
import { useConfirm } from '../ui/dialog-provider';
import { MoreMenu, type MenuItem } from '../ui/more-menu';

export type WorkspaceMode = 'rate' | 'review' | 'preview';

const RANKING_TAB = 'ranking';

export function Workspace({ data, mode, backHref, canQc = false }: { data: WorkspaceDTO; mode: WorkspaceMode; backHref: string; canQc?: boolean }) {
  const router = useRouter();
  const { task, fields, submission } = data;
  const responses = task.responses;
  const editable = mode === 'rate' && !data.readOnly && submission !== null;

  const [answers, setAnswers] = useState<AnswerMap>(submission?.answers ?? {});
  const [activeTab, setActiveTab] = useState<string>(responses[0]?.id ?? RANKING_TAB);
  const [lightbox, setLightbox] = useState<{ responseId: string; index: number } | null>(null);
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [unclaimOpen, setUnclaimOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateNote, setEscalateNote] = useState('');
  const [comments, setComments] = useState<ReviewCommentDTO[]>(submission?.comments ?? []);

  const autosave = useAutosave(submission?.id ?? null, editable);
  const confirm = useConfirm();
  function applyAnswers(changes: AnswerMap) {
    setAnswers((current) => ({ ...current, ...changes }));
    setIssues((current) => current.filter((i) => !(answerKey(i.fieldId, i.responseId) in changes)));
    for (const field of fields) {
      const scopes = field.scope === 'PER_TASK' ? [null] : responses.map((r) => r.id);
      for (const responseId of scopes) {
        const key = answerKey(field.id, responseId);
        if (key in changes) autosave.queue(field.id, responseId, changes[key]);
      }
    }
  }
  const qc = useQc(submission?.id ?? null, applyAnswers);
  const humanise = useHumanise({ fields, responses, answers, applyAnswers });
  const aiTools = editable && canQc;
  const seconds = useActiveTimer(submission?.id ?? null, editable, submission?.activeSeconds ?? 0);
  const independenceCheck = useMemo(() => needsIndependenceCheck(task.instructions), [task.instructions]);
  const hasTaskFields = fields.some((f) => f.scope === 'PER_TASK' && f.type !== 'SECTION');

  useEffect(() => {
    if (editable && submission) setAnswers((current) => restorePending(submission.id, current));
  }, [editable, submission]);

  const progress = useCallback(
    (responseId: string | null) => progressFor(fields, responses, answers, responseId),
    [fields, responses, answers],
  );

  const tabs: TabItem[] = [
    ...responses.map((r) => ({ id: r.id, label: `Response ${r.label}`, completion: submission ? completionState(progress(r.id)) : undefined })),
    ...(hasTaskFields ? [{ id: RANKING_TAB, label: 'Ranking', completion: submission ? completionState(progress(null)) : undefined }] : []),
  ];

  const activeResponse = responses.find((r) => r.id === activeTab) ?? null;
  const activeScope = activeResponse?.id ?? null;
  const activeProgress = progress(activeScope);
  const invalidKeys = useMemo(() => new Set(issues.map((i) => answerKey(i.fieldId, i.responseId))), [issues]);

  function onChange(field: RubricFieldDef, responseId: string | null, value: AnswerValue) {
    if (!editable) return;
    const key = answerKey(field.id, responseId);
    setAnswers((current) => ({ ...current, [key]: value }));
    if (invalidKeys.has(key)) setIssues((current) => current.filter((i) => answerKey(i.fieldId, i.responseId) !== key));
    autosave.queue(field.id, responseId, value);
  }

  function jumpTo(issue: FieldIssue) {
    setIssuesOpen(false);
    setActiveTab(issue.responseId ?? RANKING_TAB);
    if (window.matchMedia('(max-width: 1023px)').matches) setSheetOpen(true);
    setTimeout(() => {
      const targets = document.querySelectorAll<HTMLElement>(`#${fieldDomId(issue.fieldId, issue.responseId)}`);
      const visible = [...targets].find((el) => el.offsetParent !== null) ?? targets[0];
      visible?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      visible?.querySelector<HTMLElement>('textarea, [role="radio"][tabindex="0"], select, input')?.focus({ preventScroll: true });
    }, 120);
  }

  async function runQc() {
    const hasAnswers = Object.values(answers).some((v) => v !== null && v !== '' && !(typeof v === 'object' && Object.keys(v).length === 0));
    if (hasAnswers) {
      const ok = await confirm({
        title: 'Replace your answers with QC?',
        description: 'QC rates every response and fills in every score and explanation. Anything you have already written will be replaced.',
        confirmLabel: 'Run QC',
      });
      if (!ok) return;
    }
    await qc.run();
  }

  async function submit() {
    if (!submission) return;
    const found = validateAnswers(fields, responses, answers);
    setIssues(found);
    if (found.length) {
      setIssuesOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      await autosave.flush();
      await api.post(`/submissions/${submission.id}/submit`);
      toast.success('Submitted. Thanks!');
      router.push('/');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.issues.length) {
        setIssues(err.issues as FieldIssue[]);
        setIssuesOpen(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Could not submit');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function claim() {
    setClaiming(true);
    try {
      await api.post(`/tasks/${task.id}/claim`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not claim this task');
    } finally {
      setClaiming(false);
    }
  }

  async function unclaim() {
    await api.post(`/tasks/${task.id}/unclaim`);
    if (submission) localStorage.removeItem(`de:pending:${submission.id}`);
    toast.success('Task returned to the queue');
    router.push('/');
    router.refresh();
  }

  async function escalate() {
    await api.post(`/tasks/${task.id}/escalate`, { note: escalateNote });
    setEscalateOpen(false);
    setEscalateNote('');
    toast.success('Sent to an admin');
  }

  const commentHandlers: CommentHandlers | undefined =
    mode === 'review' && submission
      ? {
          canAdd: submission.status === 'SUBMITTED',
          onAdd: async (field, responseId, draft: CommentDraft) => {
            try {
              const created = await api.post<{ id: string; createdAt: string }>(`/reviews/${submission.id}/comments`, {
                fieldId: field.id,
                responseId,
                body: draft.body,
                suggestedValue: draft.suggestedValue,
              });
              setComments((current) => [
                ...current,
                { id: created.id, fieldId: field.id, responseId, body: draft.body, suggestedValue: draft.suggestedValue, reviewerName: 'You', createdAt: created.createdAt, draft: true },
              ]);
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'Could not add comment');
            }
          },
          onDelete: async (commentId) => {
            try {
              await api.delete(`/reviews/comments/${commentId}`);
              setComments((current) => current.filter((c) => c.id !== commentId));
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : 'Could not delete comment');
            }
          },
        }
      : mode === 'rate' && comments.length
        ? { canAdd: false }
        : undefined;

  const renderer = (
    <RubricRenderer
      fields={fields}
      responseId={activeScope}
      responses={responses}
      answers={answers}
      onChange={onChange}
      readOnly={!editable}
      comments={comments}
      commentHandlers={commentHandlers}
      invalidKeys={invalidKeys}
      independenceCheck={independenceCheck}
      textFooter={
        aiTools
          ? (field, responseId) => {
              const key = answerKey(field.id, responseId);
              return (
                <HumaniseTools
                  busyMode={humanise.busy[key]}
                  info={humanise.info[key]}
                  disabled={qc.running}
                  onRun={(mode) => void humanise.runField(field, responseId, mode)}
                />
              );
            }
          : undefined
      }
    />
  );

  const menuItems: MenuItem[] =
    mode === 'rate' && submission
      ? [
          ...(aiTools
            ? [
                { label: qc.running ? 'QC is running…' : 'QC', icon: Sparkles, onSelect: () => void runQc(), disabled: qc.running || humanise.anyBusy, hint: 'Rate every response with AI' },
                ...HUMANISE_MODES.map((m) => ({
                  label: `${MODE_LABELS[m]} all`,
                  icon: Wand2,
                  onSelect: () => void humanise.runAll(m),
                  disabled: qc.running || humanise.anyBusy,
                })),
              ]
            : []),
          ...(editable ? [{ label: 'Escalate', icon: Flag, onSelect: () => setEscalateOpen(true), hint: 'Tell an admin something is wrong' }] : []),
          ...(submission.status === 'DRAFT' ? [{ label: 'Unclaim', icon: Undo2, onSelect: () => setUnclaimOpen(true), hint: 'Give the task back to the queue' }] : []),
        ]
      : [];

  const panelTitle = activeResponse ? `Response ${activeResponse.label}` : 'Ranking';
  const lightboxResponse = lightbox ? responses.find((r) => r.id === lightbox.responseId) : null;

  return (
    <div className="pb-24 lg:pb-10">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface">
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Link href={backHref} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-muted" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-meta">
            <span className="hidden whitespace-nowrap text-fg-muted md:inline">{task.projectName}</span>
            <span className="hidden text-fg-subtle md:inline">/</span>
            <span className="hidden sm:inline-flex">
              <PriorityBadge priority={task.priority} />
            </span>
            <span className="truncate text-[15px] font-medium" title={task.title}>
              {task.title}
            </span>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {mode === 'preview' && <span className="rounded-sm bg-sky px-2 py-1 text-meta font-medium text-cocoa">Preview as rater</span>}
            {mode === 'review' && submission && (
              <>
                <span className="hidden text-meta text-fg-muted md:inline">{submission.raterName ?? submission.raterEmail}</span>
                <span className="hidden items-center gap-1 text-meta text-fg-muted md:inline-flex">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(submission.activeSeconds)}
                </span>
                <StatusBadge status={submission.status} />
              </>
            )}
            {mode === 'rate' && submission && (
              <>
                {aiTools && (
                  <Button variant="yellow" size="sm" className="hidden lg:inline-flex" onClick={runQc} loading={qc.running} disabled={humanise.anyBusy} title="Rate every response with AI using the QC rules">
                    {!qc.running && <Sparkles className="h-4 w-4" aria-hidden />}
                    {qc.running ? 'Running QC…' : 'QC'}
                  </Button>
                )}
                {aiTools && (
                  <span className="hidden lg:inline-flex">
                    <HumaniseAllMenu busy={humanise.anyBusy} disabled={qc.running} onRun={humanise.runAll} />
                  </span>
                )}
                {editable && <SaveIndicator state={autosave.state} />}
                <span className="hidden items-center gap-1 text-meta text-fg-muted tabular-nums sm:inline-flex" aria-label="Active time">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuration(seconds)}
                </span>
                {!editable && <StatusBadge status={submission.status} />}
                {submission.status === 'DRAFT' && (
                  <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => setUnclaimOpen(true)}>
                    <Undo2 className="h-4 w-4" aria-hidden /> Unclaim
                  </Button>
                )}
                {editable && (
                  <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => setEscalateOpen(true)}>
                    <Flag className="h-4 w-4" aria-hidden /> Escalate
                  </Button>
                )}
                {editable && (
                  <Button size="sm" onClick={submit} loading={submitting}>
                    {submission.status === 'RETURNED' ? 'Resubmit' : 'Submit'}
                  </Button>
                )}
                <MoreMenu items={menuItems} className="lg:hidden" />
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 pt-5 sm:px-6">
        {mode === 'rate' && !submission && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-sky px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-cocoa">
              <Info className="h-4 w-4" aria-hidden /> You haven&apos;t started this task yet. Claim it to start rating.
            </p>
            <Button size="sm" onClick={claim} loading={claiming}>
              Start task
            </Button>
          </div>
        )}
        {mode === 'rate' && submission?.status === 'RETURNED' && (
          <div className="flex items-center gap-2 rounded-lg bg-pink px-4 py-3 text-sm text-cocoa">
            <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
            A reviewer sent this back. Their comments sit next to each field. Make your changes, then resubmit.
          </div>
        )}

        {qc.running && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow/50 px-4 py-3 text-sm text-cocoa" role="status">
            <Sparkles className="h-4 w-4 shrink-0 animate-pulse" aria-hidden />
            QC is reading the brief, the input files and every slide. This usually takes one to three minutes. You can keep looking at the slides.
          </div>
        )}
        {qc.notes && (
          <div className="flex items-start gap-2 rounded-lg bg-yellow/50 px-4 py-3 text-sm text-cocoa">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="flex-1 whitespace-pre-wrap">
              <span className="font-medium">Check before submitting: </span>
              {qc.notes}
            </p>
            <button type="button" onClick={qc.dismissNotes} aria-label="Dismiss" className="rounded-sm p-0.5 hover:bg-cocoa/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <BriefCard task={task} />

        <div className="sticky top-14 z-20 -mx-4 bg-page/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <SegmentedTabs items={tabs} active={activeTab} onChange={setActiveTab} label="Responses" />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-7" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {activeResponse ? (
              <>
                {activeResponse.files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeResponse.files.map((file) => (
                      <FileChip key={file.id} file={file} />
                    ))}
                  </div>
                )}
                {activeResponse.slides.length === 0 && <p className="text-sm text-fg-muted">This response has no slides.</p>}
                {activeResponse.slides.map((slide, index) => (
                  <SlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    total={activeResponse.slides.length}
                    onOpen={() => setLightbox({ responseId: activeResponse.id, index })}
                  />
                ))}
              </>
            ) : (
              <div className="space-y-6">
                {responses.map((response) => (
                  <section key={response.id} className="space-y-2">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <ResponseChip label={response.label} /> Response {response.label}
                      <span className="text-meta font-normal text-fg-muted">{response.slides.length} slides</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {response.slides.map((slide, index) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setLightbox({ responseId: response.id, index })}
                          className="aspect-video overflow-hidden rounded-md border border-border bg-subtle"
                          aria-label={`Open response ${response.label} slide ${index + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={slide.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <aside className="hidden lg:col-span-5 lg:block" aria-label="Rating">
            <div className="sticky top-[112px] max-h-[calc(100vh-128px)] overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-card">
              <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-section font-medium">
                  {activeResponse && <ResponseChip label={activeResponse.label} />}
                  {panelTitle}
                </h2>
                {submission && (
                  <span className="text-meta text-fg-muted">
                    {activeProgress.done} of {activeProgress.total} fields done
                  </span>
                )}
              </div>
              {renderer}
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 lg:hidden">
        <Button className="w-full" size="lg" variant={editable ? 'primary' : 'secondary'} onClick={() => setSheetOpen(true)}>
          {editable ? 'Rate' : 'View'} {panelTitle}
          {submission && ` · ${activeProgress.done}/${activeProgress.total}`}
        </Button>
      </div>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title={panelTitle}>
        {renderer}
      </Sheet>

      {mode === 'review' && submission?.status === 'SUBMITTED' && <ReviewFooter submissionId={submission.id} commentCount={comments.length} />}

      {lightboxResponse && lightbox && (
        <SlideLightbox
          slides={lightboxResponse.slides}
          responseLabel={lightboxResponse.label}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox({ ...lightbox, index })}
          onClose={() => setLightbox(null)}
        />
      )}

      <Dialog open={issuesOpen} onOpenChange={setIssuesOpen}>
        <DialogContent title="A few fields still need attention" description="Select a field to jump to it.">
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {issues.map((issue) => (
              <li key={answerKey(issue.fieldId, issue.responseId)}>
                <button
                  type="button"
                  onClick={() => jumpTo(issue)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {issue.responseLabel ? <ResponseChip label={issue.responseLabel} /> : <span className="text-meta font-semibold text-fg-muted">Task</span>}
                  <span>
                    <span className="font-medium">{issue.label}</span>
                    <span className="text-fg-muted"> · {issue.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={unclaimOpen}
        onOpenChange={setUnclaimOpen}
        title="Unclaim this task?"
        description="Your answers so far will be deleted and the task goes back to the queue."
        confirmLabel="Unclaim"
        destructive
        onConfirm={unclaim}
      />

      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent title="Escalate to an admin" description="Say what's wrong, for example broken slides or unclear instructions.">
          <Textarea rows={4} value={escalateNote} onChange={(e) => setEscalateNote(e.target.value)} aria-label="Note for the admin" />
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={escalate} disabled={!escalateNote.trim()}>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
