'use client';

import * as Popover from '@radix-ui/react-popover';
import { AlertTriangle, ChevronDown, Loader2, Wand2 } from 'lucide-react';
import { HUMANISE_MODES, type HumaniseMode } from '@/lib/shared';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { MODE_LABELS, type HumaniseInfo } from './use-humanise';

function ScoreChip({ info }: { info: HumaniseInfo }) {
  if (!info.applied) {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-pink px-2 py-0.5 text-[12px] text-cocoa" title={info.missing.join('\n')}>
        <AlertTriangle className="h-3 w-3" aria-hidden /> Kept original: a key point kept getting lost
      </span>
    );
  }
  return (
    <span
      className={cn('rounded-pill px-2 py-0.5 text-[12px] font-medium text-cocoa', info.score >= 10 ? 'bg-lime' : 'bg-yellow')}
      title={`${MODE_LABELS[info.mode]}. Every key point kept.`}
    >
      Human score {info.score}/10
    </span>
  );
}

export function HumaniseTools({
  busyMode,
  info,
  disabled,
  onRun,
}: {
  busyMode?: HumaniseMode;
  info?: HumaniseInfo;
  disabled?: boolean;
  onRun: (mode: HumaniseMode) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {HUMANISE_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          disabled={disabled || !!busyMode}
          onClick={() => onRun(mode)}
          className="inline-flex h-7 items-center gap-1 rounded-sm border border-border-strong bg-surface px-2 text-[12px] font-medium text-fg-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-50"
        >
          {busyMode === mode ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Wand2 className="h-3 w-3" aria-hidden />}
          {busyMode === mode ? 'Rewriting…' : MODE_LABELS[mode]}
        </button>
      ))}
      {info && !busyMode && <ScoreChip info={info} />}
    </div>
  );
}

export function HumaniseAllMenu({ busy, disabled, onRun }: { busy: boolean; disabled?: boolean; onRun: (mode: HumaniseMode) => void }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="secondary" size="sm" loading={busy} disabled={disabled}>
          {!busy && <Wand2 className="h-4 w-4" aria-hidden />}
          {busy ? 'Humanising…' : 'Humanise all'}
          {!busy && <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-72 rounded-lg border border-border bg-surface p-1.5 shadow-card">
          {HUMANISE_MODES.map((mode) => (
            <Popover.Close asChild key={mode}>
              <button type="button" onClick={() => onRun(mode)} className="w-full rounded-md px-3 py-2 text-left hover:bg-muted">
                <span className="block text-sm font-medium">{MODE_LABELS[mode]}</span>
                <span className="block text-[12px] text-fg-muted">
                  {mode === 'chatgpt' ? 'ChatGPT rewrites every box and rates it until 10/10.' : 'ChatGPT and Claude rewrite every box in your voice until 10/10.'}
                </span>
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
