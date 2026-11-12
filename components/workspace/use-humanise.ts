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

export type HumaniseInfo = Pick<HumanisedText, 'score' | 'missing' | 'applied' | 'rounds'> & { mode: HumaniseMode };

interface Options {
  fields: RubricFieldDef[];
  responses: ResponseRef[];
  answers: AnswerMap;
  applyAnswers: (changes: AnswerMap) => void;
}

function summary(result: HumaniseResult): string {
  const rewritten = result.items.filter((i) => i.applied && i.rounds > 0).length;
  const already = result.items.filter((i) => i.applied && i.rounds === 0).length;
  const lostPoint = result.items.filter((i) => !i.applied && i.missing.length).length;
  const lowScore = result.items.filter((i) => !i.applied && !i.missing.length).length;
  const parts = [`Rewrote ${rewritten} of ${result.items.length + result.failed.length} boxes, all at 10/10.`];
  if (already) parts.push(`${already} already read 10/10 and were left as they are.`);
  if (lowScore) parts.push(`${lowScore} kept the original because no rewrite reached 10/10.`);
  if (lostPoint) parts.push(`${lostPoint} kept the original because a key point would have been lost.`);
  if (result.failed.length) parts.push(`${result.failed.length} failed.`);
  return parts.join(' ');
}

export function keptReason(item: Pick<HumanisedText, 'score' | 'missing'>): string {
  return item.missing.length ? 'the rewrite kept losing a key point' : `the best rewrite reached ${item.score}/10, not 10/10`;
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
        ...Object.fromEntries(result.items.map((i) => [i.key, { score: i.score, missing: i.missing, applied: i.applied, rounds: i.rounds, mode }])),
      }));
      const message = items.length === 1 ? null : summary(result);
      const single = result.items[0];
      const text =
        message ??
        (result.failed[0]
          ? `Rewrite failed: ${result.failed[0].error}`
          : !single.applied
            ? `Kept your text: ${keptReason(single)}.`
            : single.rounds === 0
              ? 'Already reads 10/10. Left as it is.'
              : `Rewritten. Human score ${single.score}/10.`);
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
