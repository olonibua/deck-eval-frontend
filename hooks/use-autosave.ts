'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { answerKey, type AnswerMap, type AnswerValue } from '@/lib/shared';
import { ApiError } from '@/lib/errors';

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'offline' }
  | { kind: 'error'; message: string };

interface PendingAnswer {
  fieldId: string;
  responseId: string | null;
  value: AnswerValue;
}

const DEBOUNCE_MS = 800;
const LIVE_DEBOUNCE_MS = 250;
const storageKey = (submissionId: string) => `de:pending:${submissionId}`;

function readPending(submissionId: string): Record<string, PendingAnswer> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(submissionId)) ?? '{}');
  } catch {
    return {};
  }
}

function writePending(submissionId: string, pending: Record<string, PendingAnswer>) {
  try {
    if (Object.keys(pending).length === 0) localStorage.removeItem(storageKey(submissionId));
    else localStorage.setItem(storageKey(submissionId), JSON.stringify(pending));
  } catch {
    // storage full or blocked: the server copy is still the source of truth
  }
}

export function restorePending(submissionId: string | null, answers: AnswerMap): AnswerMap {
  if (!submissionId || typeof window === 'undefined') return answers;
  const pending = readPending(submissionId);
  const restored = { ...answers };
  for (const [key, item] of Object.entries(pending)) restored[key] = item.value;
  return restored;
}

export function useAutosave(submissionId: string | null, enabled: boolean, live = false) {
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const pending = useRef<Record<string, PendingAnswer>>({});
  const savedAt = useRef<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const send = useCallback(
    async (keepalive = false) => {
      if (!submissionId || !enabled) return;
      const batch = { ...pending.current };
      const entries = Object.entries(batch);
      if (entries.length === 0) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setState({ kind: 'offline' });
        return;
      }
      setState({ kind: 'saving' });
      try {
        const res = await fetch(`/api/submissions/${submissionId}/answers`, {
          method: 'PUT',
          credentials: 'include',
          keepalive,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ answers: entries.map(([, a]) => a) }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ApiError(res.status, body.message ?? 'Save failed');
        }
        const { savedAt: at } = (await res.json()) as { savedAt: string };
        for (const [key, item] of entries) {
          savedAt.current[key] = at;
          if (pending.current[key] === item) delete pending.current[key];
        }
        writePending(submissionId, pending.current);
        setState(Object.keys(pending.current).length ? { kind: 'saving' } : { kind: 'saved', at: new Date() });
      } catch (error) {
        if (error instanceof ApiError) setState({ kind: 'error', message: error.message });
        else setState({ kind: 'offline' });
      }
    },
    [submissionId, enabled],
  );

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inFlight.current) await inFlight.current;
    inFlight.current = send();
    await inFlight.current;
    inFlight.current = null;
  }, [send]);

  const queue = useCallback(
    (fieldId: string, responseId: string | null, value: AnswerValue) => {
      if (!submissionId || !enabled) return;
      pending.current[answerKey(fieldId, responseId)] = { fieldId, responseId, value };
      writePending(submissionId, pending.current);
      setState({ kind: 'saving' });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), live ? LIVE_DEBOUNCE_MS : DEBOUNCE_MS);
    },
    [submissionId, enabled, flush, live],
  );

  const isUnsent = useCallback((key: string) => key in pending.current, []);
  const lastSavedAt = useCallback((key: string) => savedAt.current[key] ?? null, []);

  useEffect(() => {
    if (!submissionId || !enabled) return;
    pending.current = readPending(submissionId);
    if (Object.keys(pending.current).length) void flush();

    const onOnline = () => void flush();
    const onHide = () => {
      if (document.visibilityState === 'hidden') void send(true);
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [submissionId, enabled, flush, send]);

  return { state, queue, flush, isUnsent, lastSavedAt };
}
