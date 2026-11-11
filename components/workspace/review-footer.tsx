'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { Button } from '../ui/button';
import { Input } from '../ui/form';

export function ReviewFooter({ submissionId, commentCount }: { submissionId: string; commentCount: number }) {
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState<'APPROVED' | 'RETURNED' | null>(null);

  async function decide(verdict: 'APPROVED' | 'RETURNED') {
    if (verdict === 'RETURNED' && commentCount === 0 && !summary.trim()) {
      toast.error('Add a comment or a summary so the rater knows what to change');
      return;
    }
    setBusy(verdict);
    try {
      await api.post(`/reviews/${submissionId}/verdict`, { verdict, summary });
      toast.success(verdict === 'APPROVED' ? 'Approved' : 'Returned to the rater');
      router.push('/review');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save the review');
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-border bg-surface/95 backdrop-blur lg:bottom-0">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
        <Input
          placeholder="Summary for the rater (optional)"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          aria-label="Review summary"
          className="sm:flex-1"
        />
        <span className="text-meta whitespace-nowrap text-fg-muted">{commentCount} comments</span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => decide('RETURNED')} loading={busy === 'RETURNED'} disabled={busy !== null}>
            Return
          </Button>
          <Button onClick={() => decide('APPROVED')} loading={busy === 'APPROVED'} disabled={busy !== null}>
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
