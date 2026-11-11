'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Inbox, Layers } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskSummaryDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { PriorityBadge, TagChip } from './ui/badges';

export function NextTaskCard({ task }: { task: TaskSummaryDTO | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const { taskId } = await api.post<{ taskId: string }>('/queue/next');
      router.push(`/tasks/${taskId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not claim a task');
      router.refresh();
      setBusy(false);
    }
  }

  if (!task) {
    return (
      <Card className="flex items-center gap-4 p-6">
        <Inbox className="h-8 w-8 text-fg-subtle" aria-hidden />
        <div>
          <p className="font-medium">No tasks waiting for you</p>
          <p className="text-sm text-fg-muted">New work will show up here as soon as it&apos;s published.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="space-y-3">
        <p className="text-meta font-medium tracking-wide text-primary uppercase">Your next task</p>
        <h2 className="text-section font-semibold">{task.title}</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          {task.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
        <p className="flex flex-wrap gap-x-4 text-meta text-fg-muted">
          <span>{task.projectName}</span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden /> {task.responseCount} responses
          </span>
          {task.dueAt && <span>Due {formatDate(task.dueAt)}</span>}
        </p>
      </div>
      <Button size="lg" onClick={start} loading={busy} className="md:min-w-48">
        Start next task <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </Card>
  );
}
