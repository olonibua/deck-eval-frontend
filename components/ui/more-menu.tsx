'use client';

import * as Popover from '@radix-ui/react-popover';
import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  hint?: string;
}

export function MoreMenu({ items, label = 'More actions', className }: { items: MenuItem[]; label?: string; className?: string }) {
  if (items.length === 0) return null;
  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted hover:bg-muted hover:text-fg', className)}
        aria-label={label}
      >
        <MoreHorizontal className="h-5 w-5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} collisionPadding={8} className="z-50 w-64 rounded-lg border border-border bg-surface p-1.5 shadow-pop">
          {items.map((item) => (
            <Popover.Close asChild key={item.label}>
              <button
                type="button"
                disabled={item.disabled}
                onClick={item.onSelect}
                className="flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden />
                <span>
                  <span className="block font-medium">{item.label}</span>
                  {item.hint && <span className="block text-[12px] text-fg-muted">{item.hint}</span>}
                </span>
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
