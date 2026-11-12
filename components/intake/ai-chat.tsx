'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { IntakeReply, IntakeTurn, ProjectDTO, TagDTO, TaskDraft } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useConfirm } from '../ui/dialog-provider';
import { Textarea } from '../ui/form';
import { DraftReview } from './draft-review';
import { AttachButton, FileDropTarget, FileTray } from './file-tray';
import { filesFromClipboard, useIntakeFiles } from './use-intake-files';

const STORAGE_KEY = 'deck-eval:intake-chat';

interface SavedChat {
  turns: IntakeTurn[];
  draft: TaskDraft | null;
  version: number;
}

const EMPTY: SavedChat = { turns: [], draft: null, version: 0 };

function loadChat(): SavedChat {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as SavedChat) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveChat(chat: SavedChat) {
  try {
    if (chat.turns.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage is a convenience only */
  }
}

function withLatestDraft(turns: IntakeTurn[], draft: TaskDraft | null): IntakeTurn[] {
  if (!draft) return turns;
  const index = turns.findLastIndex((t) => t.role === 'assistant' && t.draft);
  return index < 0 ? turns : turns.map((t, i) => (i === index ? { ...t, draft } : t));
}

function Message({ turn, fileNames }: { turn: IntakeTurn; fileNames: Map<string, string> }) {
  const mine = turn.role === 'user';
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] rounded-lg px-4 py-3 text-[15px] leading-relaxed', mine ? 'bg-fg text-page' : 'border border-border bg-surface')}>
        {!mine && (
          <p className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-fg-muted">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Assistant
          </p>
        )}
        {turn.text && <p className="whitespace-pre-wrap">{turn.text}</p>}
        {turn.fileIds.length > 0 && (
          <p className={cn('mt-2 text-[12px]', mine ? 'text-page/70' : 'text-fg-muted')}>
            {turn.fileIds.map((id) => fileNames.get(id) ?? 'file').join(' · ')}
          </p>
        )}
        {turn.draft && <p className="mt-2 inline-block rounded-pill bg-lime px-2 py-0.5 text-[12px] font-medium text-cocoa">Draft updated</p>}
      </div>
    </li>
  );
}

export function AiChat({
  aiEnabled,
  projects,
  tags,
  onCreate,
  onUseSmartImport,
}: {
  aiEnabled: boolean;
  projects: ProjectDTO[];
  tags: TagDTO[];
  onCreate: (draft: TaskDraft) => Promise<boolean>;
  onUseSmartImport: () => void;
}) {
  const confirm = useConfirm();
  const [chat, setChat] = useState<SavedChat>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [attached, setAttached] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChat(loadChat());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveChat(chat);
  }, [chat, loaded]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.turns.length, thinking]);

  const knownIds = useMemo(() => (loaded ? [...new Set(chat.turns.flatMap((t) => t.fileIds))] : []), [loaded, chat.turns]);
  const intake = useIntakeFiles(knownIds);
  const fileNames = new Map(intake.files.map((f) => [f.id, f.name]));
  const attachedFiles = intake.files.filter((f) => attached.includes(f.id));
  const waiting = intake.uploading || attachedFiles.some((f) => f.status === 'processing');
  const failed = attachedFiles.filter((f) => f.status === 'failed');
  const canSend = aiEnabled && !thinking && !waiting && failed.length === 0 && (text.trim().length > 0 || attached.length > 0);

  async function attach(files: File[]) {
    const added = await intake.add(files);
    setAttached((current) => [...current, ...added.map((f) => f.id)]);
  }

  async function send() {
    if (!canSend) return;
    const userTurn: IntakeTurn = { role: 'user', text: text.trim(), fileIds: attached, draft: null };
    const turns = [...withLatestDraft(chat.turns, chat.draft), userTurn];
    setChat((current) => ({ ...current, turns }));
    setText('');
    setAttached([]);
    setThinking(true);
    try {
      const reply = await api.post<IntakeReply>('/admin/intake/chat', { turns });
      const assistantTurn: IntakeTurn = { role: 'assistant', text: reply.reply, fileIds: [], draft: reply.draft };
      setChat((current) => ({
        turns: [...current.turns, assistantTurn],
        draft: reply.draft ?? current.draft,
        version: reply.draft ? current.version + 1 : current.version,
      }));
    } catch (error) {
      toast.error((error as Error).message);
      setChat((current) => ({ ...current, turns: current.turns.slice(0, -1) }));
      setText(userTurn.text);
      setAttached(userTurn.fileIds);
    } finally {
      setThinking(false);
    }
  }

  async function startOver() {
    const ok = await confirm({ title: 'Start over?', description: 'This clears the conversation and the draft. Tasks you already created stay.', confirmLabel: 'Start over', destructive: true });
    if (!ok) return;
    setChat(EMPTY);
    setAttached([]);
    intake.reset();
  }

  async function create() {
    if (!chat.draft) return;
    setCreating(true);
    const ok = await onCreate(chat.draft);
    setCreating(false);
    if (ok) {
      setChat(EMPTY);
      intake.reset();
    }
  }

  if (!aiEnabled) {
    return (
      <Card className="p-6">
        <p className="font-medium">AI is not set up on the server yet.</p>
        <p className="mt-1 text-sm text-fg-muted">Add ANTHROPIC_API_KEY to the API service variables and redeploy. Until then, Smart import does the same job without AI.</p>
        <Button variant="secondary" className="mt-4" onClick={onUseSmartImport}>
          Use Smart import
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <FileDropTarget onFiles={attach} className="flex min-h-[560px] flex-col rounded-lg border border-border bg-subtle/60">
        <div className="flex-1 overflow-y-auto p-4">
          {chat.turns.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-fg-muted" aria-hidden />
              <p className="mt-3 font-medium">Paste everything about the task</p>
              <p className="mt-1 text-sm text-fg-muted">
                Instructions, the user request, response decks (PDF, PowerPoint or slide images), input files and screenshots. The assistant fills in the task and asks if anything is unclear.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {chat.turns.map((turn, i) => (
                <Message key={i} turn={turn} fileNames={fileNames} />
              ))}
              {thinking && (
                <li className="flex">
                  <p className="animate-pulse rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted">Reading your files and filling in the task…</p>
                </li>
              )}
            </ul>
          )}
          <div ref={bottom} />
        </div>
        <div className="border-t border-border bg-surface p-3">
          <FileTray intake={intake} files={attachedFiles} />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={(e) => {
              const pasted = filesFromClipboard(e);
              if (pasted.length) {
                e.preventDefault();
                void attach(pasted);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void send();
              }
            }}
            rows={4}
            placeholder="Paste instructions, the user request or screenshots here…"
            aria-label="Message"
            className={cn('resize-y border-0 px-1 hover:border-0 focus-visible:border-0', attachedFiles.length > 0 && 'mt-3')}
          />
          <div className="mt-2 flex items-center gap-2">
            <AttachButton onFiles={attach} />
            {chat.turns.length > 0 && (
              <button type="button" onClick={startOver} className="h-9 rounded-sm px-2.5 text-sm text-fg-muted hover:bg-muted hover:text-fg">
                Start over
              </button>
            )}
            <span className="ml-auto hidden text-[12px] text-fg-subtle sm:inline">{waiting ? 'Waiting for files…' : '⌘/Ctrl + Enter to send'}</span>
            <Button size="icon" className="h-9 w-9 rounded-full" disabled={!canSend} loading={thinking} onClick={() => void send()} aria-label="Send">
              {!thinking && <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </FileDropTarget>

      {chat.draft ? (
        <DraftReview
          draft={chat.draft}
          version={chat.version}
          files={intake.files}
          projects={projects}
          tags={tags}
          creating={creating}
          onChange={(draft) => setChat((current) => ({ ...current, draft }))}
          onCreate={() => void create()}
        />
      ) : (
        <Card className="hidden p-6 text-sm text-fg-muted xl:block">The draft task appears here once the assistant has read your message. You can edit any field before creating it.</Card>
      )}
    </div>
  );
}
