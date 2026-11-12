import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-border bg-surface shadow-card', className)} {...props} />;
}

export function PageHeader({
  title,
  eyebrow,
  meta,
  actions,
}: {
  title: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="stamp mb-2">{eyebrow}</p>}
        <h1 className="text-title font-medium">{title}</h1>
        {meta && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg-muted">{meta}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export const tableHead = 'bg-fg text-left text-[11px] font-semibold tracking-[0.05em] text-page uppercase';
export const tableRow = 'border-b border-border last:border-0 hover:bg-subtle/60';
