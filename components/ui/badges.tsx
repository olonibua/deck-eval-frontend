import type { SubStatus, TagDTO, TaskStatus } from '@/lib/shared';
import { cn } from '@/lib/cn';

const badge = 'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-badge font-semibold uppercase tracking-[0.02em] whitespace-nowrap';

const STATUS_STYLE: Record<TaskStatus | SubStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-fg-muted' },
  PUBLISHED: { label: 'Published', className: 'bg-info-soft text-info' },
  IN_PROGRESS: { label: 'In progress', className: 'bg-info-soft text-info' },
  SUBMITTED: { label: 'Submitted', className: 'bg-warn-soft text-warn' },
  RETURNED: { label: 'Returned', className: 'bg-danger-soft text-danger' },
  APPROVED: { label: 'Approved', className: 'bg-success-soft text-success' },
  COMPLETED: { label: 'Completed', className: 'bg-success-soft text-success' },
  ARCHIVED: { label: 'Archived', className: 'bg-muted text-fg-subtle' },
};

export function StatusBadge({ status, className }: { status: TaskStatus | SubStatus; className?: string }) {
  const style = STATUS_STYLE[status];
  return <span className={cn(badge, style.className, className)}>{style.label}</span>;
}

const PRIORITY_STYLE: Record<number, string> = {
  1: 'bg-danger-soft text-danger',
  2: 'bg-warn-soft text-warn',
  3: 'bg-muted text-fg-muted',
};

export function PriorityBadge({ priority }: { priority: number }) {
  return <span className={cn(badge, PRIORITY_STYLE[priority] ?? PRIORITY_STYLE[3])}>Priority {priority}</span>;
}

export function TagChip({ tag }: { tag: TagDTO }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2 py-0.5 text-[12px] font-medium text-fg-muted">
      <span className="h-2 w-2 rounded-full" style={{ background: tag.color }} aria-hidden />
      {tag.name}
    </span>
  );
}

export function ResponseChip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 text-[12px] font-bold text-white', className)}
      style={{ background: `var(--resp-${label.toLowerCase()})` }}
    >
      {label}
    </span>
  );
}
