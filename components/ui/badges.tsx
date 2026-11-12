import type { SubStatus, TagDTO, TaskStatus } from '@/lib/shared';
import { cn } from '@/lib/cn';

const pill = 'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-cocoa';
const dot = 'h-1.5 w-1.5 rounded-full bg-cocoa/60';

const STATUS_STYLE: Record<TaskStatus | SubStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-fg' },
  PUBLISHED: { label: 'Published', className: 'bg-sky' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-sky' },
  SUBMITTED: { label: 'Submitted', className: 'bg-yellow' },
  RETURNED: { label: 'Returned', className: 'bg-pink' },
  APPROVED: { label: 'Approved', className: 'bg-lime' },
  COMPLETED: { label: 'Completed', className: 'bg-lime' },
  ARCHIVED: { label: 'Archived', className: 'bg-muted text-fg-muted' },
};

export function StatusBadge({ status, className }: { status: TaskStatus | SubStatus; className?: string }) {
  const style = STATUS_STYLE[status];
  return (
    <span className={cn(pill, style.className, className)}>
      <span className={dot} aria-hidden />
      {style.label}
    </span>
  );
}

const PRIORITY_STYLE: Record<number, string> = {
  1: 'bg-orange',
  2: 'bg-yellow',
  3: 'bg-muted text-fg',
};

export function PriorityBadge({ priority }: { priority: number }) {
  return <span className={cn(pill, PRIORITY_STYLE[priority] ?? PRIORITY_STYLE[3])}>Priority {priority}</span>;
}

export function TagChip({ tag }: { tag: TagDTO }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-0.5 text-[12px] font-medium text-fg-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: tag.color }} aria-hidden />
      {tag.name}
    </span>
  );
}

const RESPONSE_FILL: Record<string, string> = { A: 'bg-yellow', B: 'bg-sky', C: 'bg-pink', D: 'bg-lime' };

export function ResponseChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-[12px] font-semibold text-cocoa',
        RESPONSE_FILL[label] ?? 'bg-muted',
        className,
      )}
    >
      {label}
    </span>
  );
}
