'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AnswerMap, JobDTO, QcResult } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { runJob } from '@/lib/jobs';

export function useQc(submissionId: string | null, onAnswers: (answers: AnswerMap) => void) {
  const [running, setRunning] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const apply = useRef(onAnswers);
  apply.current = onAnswers;

  const run = useCallback(async () => {
    if (!submissionId) return;
    setRunning(true);
    setNotes(null);
    try {
      const result = await runJob(() => api.post<JobDTO<QcResult>>(`/submissions/${submissionId}/qc`));
      apply.current(result.answers);
      setNotes(result.notes);
      toast.success('QC filled in the ratings. Read through them before you submit.');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRunning(false);
    }
  }, [submissionId]);

  return { run, running, notes, dismissNotes: () => setNotes(null) };
}
