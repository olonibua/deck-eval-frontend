'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskSummaryDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { Button } from './ui/button';
import { TagChip } from './ui/badges';

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
      <div className="notebook flex items-center gap-4 bg-[var(--lime)]">
        <Inbox className="h-7 w-7 shrink-0" aria-hidden />
        <div>
          <p className="stamp text-cocoa/80">Your next task</p>
          <p className="mt-1 text-section font-medium">Nothing waiting right now</p>
          <p className="mt-1 text-sm opacity-80">New work shows up here as soon as it&apos;s published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-[880px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/posy/sticker-document.svg" alt="" aria-hidden className="absolute -top-10 -right-6 z-10 hidden h-24 w-24 rotate-8 md:block" />
      <div className="notebook notebook-tilt flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:pr-10">
        <div className="min-w-0 space-y-3">
          <p className="stamp text-cocoa/80">
            Your next task · Priority {task.priority} · {task.projectName}
          </p>
          <h2 className="text-[32px] leading-[1.05] font-medium tracking-[-1px]">{task.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {task.tags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
            <span className="text-[13px] opacity-80">
              {task.responseCount} responses{task.dueAt ? ` · due ${formatDate(task.dueAt)}` : ''}
            </span>
          </div>
        </div>
        <Button size="lg" onClick={start} loading={busy} className="shrink-0 bg-cocoa text-cream hover:bg-cocoa/90">
          Start next task <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
