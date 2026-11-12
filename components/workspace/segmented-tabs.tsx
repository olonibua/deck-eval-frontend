'use client';

import type { CompletionState } from '@/lib/shared';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  completion?: CompletionState;
}

const DOT: Record<CompletionState, { className: string; text: string }> = {
  empty: { className: 'bg-border-strong', text: 'not started' },
  partial: { className: 'bg-orange', text: 'partly done' },
  done: { className: 'bg-success', text: 'done' },
};

export function SegmentedTabs({ items, active, onChange, label }: { items: TabItem[]; active: string; onChange: (id: string) => void; label: string }) {
  function onKeyDown(event: React.KeyboardEvent) {
    const index = items.findIndex((i) => i.id === active);
    if (event.key === 'ArrowRight') onChange(items[(index + 1) % items.length].id);
    if (event.key === 'ArrowLeft') onChange(items[(index - 1 + items.length) % items.length].id);
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex max-w-full gap-2 overflow-x-auto">
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-sm px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150',
              selected ? 'bg-fg text-page' : 'border border-border-strong bg-surface text-fg hover:bg-subtle',
            )}
          >
            {item.label}
            {item.completion && (
              <>
                <span className={cn('h-2 w-2 rounded-full ring-1 ring-surface/60', DOT[item.completion].className)} aria-hidden />
                <span className="sr-only">({DOT[item.completion].text})</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
