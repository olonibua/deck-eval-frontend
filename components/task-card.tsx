import Link from 'next/link';
import { CalendarClock, Layers } from 'lucide-react';
import type { DashboardItemDTO } from '@/lib/shared';
import { formatDate } from '@/lib/format';
import { Card } from './ui/card';
import { PriorityBadge, StatusBadge, TagChip } from './ui/badges';

export function TaskCard({ item }: { item: DashboardItemDTO }) {
  const { task, submissionStatus, progress } = item;
  const cta = submissionStatus === 'RETURNED' ? 'Revise' : submissionStatus === 'DRAFT' ? 'Continue' : 'View';
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-[17px] leading-snug font-medium tracking-[-0.2px]">{task.title}</h3>
        {submissionStatus && <StatusBadge status={submissionStatus} />}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.tags.map((tag) => (
          <TagChip key={tag.id} tag={tag} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-fg-muted">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" aria-hidden /> {task.responseCount} responses
        </span>
        {task.dueAt && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Due {formatDate(task.dueAt)}
          </span>
        )}
        {progress && progress.total > 0 && (
          <span>
            {progress.done} of {progress.total} fields done
          </span>
        )}
      </div>
      {progress && progress.total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-pill bg-muted" aria-hidden>
          <div className="h-full bg-orange" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}
      <div className="mt-auto pt-1">
        <Link
          href={`/tasks/${task.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-fg px-3.5 text-[13px] font-medium text-page transition hover:-translate-y-px"
        >
          {cta}
        </Link>
      </div>
    </Card>
  );
}
