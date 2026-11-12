'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  answerKey,
  type AnswerMap,
  type HumaniseItem,
  type HumaniseMode,
  type HumaniseResult,
  type HumanisedText,
  type JobDTO,
  type ResponseRef,
  type RubricFieldDef,
} from '@/lib/shared';
import { api } from '@/lib/client-api';
import { runJob } from '@/lib/jobs';

export const MODE_LABELS: Record<HumaniseMode, string> = { chatgpt: 'ChatGPT humanise', voice: 'Human humanise' };

export type HumaniseInfo = Pick<HumanisedText, 'score' | 'missing' | 'applied'> & { mode: HumaniseMode };

interface Options {
  fields: RubricFieldDef[];
  responses: ResponseRef[];
  answers: AnswerMap;
  applyAnswers: (changes: AnswerMap) => void;
}

function summary(result: HumaniseResult): string {
  const kept = result.items.filter((i) => !i.applied).length;
  const low = result.items.filter((i) => i.applied && i.score < 10).length;
  const parts = [`Rewrote ${result.items.length - kept} of ${result.items.length + result.failed.length} boxes.`];
  if (low) parts.push(`${low} scored below 10/10.`);
  if (kept) parts.push(`${kept} kept the original because a key point would have been lost.`);
  if (result.failed.length) parts.push(`${result.failed.length} failed.`);
  if (!low && !kept && !result.failed.length) parts.push('All scored 10/10 with every key point kept.');
  return parts.join(' ');
}

export function useHumanise({ fields, responses, answers, applyAnswers }: Options) {
  const [busy, setBusy] = useState<Record<string, HumaniseMode>>({});
  const [info, setInfo] = useState<Record<string, HumaniseInfo>>({});
  const latest = useRef({ answers, applyAnswers });
  latest.current = { answers, applyAnswers };

  const labelFor = useCallback(
    (field: RubricFieldDef, responseId: string | null) => {
      const response = responses.find((r) => r.id === responseId);
      return response ? `Response ${response.label} · ${field.label}` : field.label;
    },
    [responses],
  );

  const run = useCallback(async (mode: HumaniseMode, items: HumaniseItem[]) => {
    if (items.length === 0) {
      toast.info('There is no written text to humanise yet.');
      return;
    }
    const keys = items.map((i) => i.key);
    setBusy((current) => ({ ...current, ...Object.fromEntries(keys.map((k) => [k, mode])) }));
    try {
      const result = await runJob(() => api.post<JobDTO<HumaniseResult>>('/admin/humanise', { mode, items }));
      const before = latest.current.answers;
      const changes: AnswerMap = {};
      const previous: AnswerMap = {};
      for (const item of result.items) {
        if (!item.applied) continue;
        changes[item.key] = item.text;
        previous[item.key] = before[item.key] ?? null;
      }
      latest.current.applyAnswers(changes);
      setInfo((current) => ({
        ...current,
        ...Object.fromEntries(result.items.map((i) => [i.key, { score: i.score, missing: i.missing, applied: i.applied, mode }])),
      }));
      const message = items.length === 1 ? null : summary(result);
      const single = result.items[0];
      const text =
        message ??
        (result.failed[0]
          ? `Rewrite failed: ${result.failed[0].error}`
          : single.applied
            ? `Rewritten. Human score ${single.score}/10.`
            : 'Kept your text: the rewrite kept losing a key point.');
      const undo = Object.keys(changes).length ? { label: 'Undo', onClick: () => latest.current.applyAnswers(previous) } : undefined;
      if (result.failed.length && !result.items.length) toast.error(text);
      else toast.success(text, { action: undo, duration: 10_000 });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy((current) => Object.fromEntries(Object.entries(current).filter(([k]) => !keys.includes(k))));
    }
  }, []);

  const runField = useCallback(
    (field: RubricFieldDef, responseId: string | null, mode: HumaniseMode) => {
      const key = answerKey(field.id, responseId);
      const text = latest.current.answers[key];
      if (typeof text !== 'string' || !text.trim()) return run(mode, []);
      return run(mode, [{ key, label: labelFor(field, responseId), text }]);
    },
    [run, labelFor],
  );

  const runAll = useCallback(
    (mode: HumaniseMode) => {
      const items: HumaniseItem[] = [];
      for (const field of fields.filter((f) => f.type === 'TEXTAREA')) {
        const scopes = field.scope === 'PER_TASK' ? [null] : responses.map((r) => r.id);
        for (const responseId of scopes) {
          const key = answerKey(field.id, responseId);
          const text = latest.current.answers[key];
          if (typeof text === 'string' && text.trim()) items.push({ key, label: labelFor(field, responseId), text });
        }
      }
      return run(mode, items);
    },
    [fields, responses, run, labelFor],
  );

  return { runField, runAll, busy, info, anyBusy: Object.keys(busy).length > 0 };
}
