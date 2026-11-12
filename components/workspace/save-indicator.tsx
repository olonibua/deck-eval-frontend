'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, CloudOff, Loader2 } from 'lucide-react';
import type { SaveState } from '@/hooks/use-autosave';
import { timeAgo } from '@/lib/format';

export function SaveIndicator({ state }: { state: SaveState }) {
  const [, rerender] = useState(0);
  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const base = 'inline-flex items-center gap-1.5 text-meta whitespace-nowrap';
  switch (state.kind) {
    case 'saving':
      return (
        <span className={`${base} text-fg-muted`} role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…
        </span>
      );
    case 'saved':
      return (
        <span className={`${base} text-fg-muted`} role="status">
          <Check className="h-3.5 w-3.5 text-success" aria-hidden /> Saved · {timeAgo(state.at)}
        </span>
      );
    case 'offline':
      return (
        <span className={`${base} rounded-sm bg-yellow px-1.5 text-cocoa`} role="status">
          <CloudOff className="h-3.5 w-3.5" aria-hidden /> Offline, saved locally
        </span>
      );
    case 'error':
      return (
        <span className={`${base} text-danger`} role="status" title={state.message}>
          <AlertCircle className="h-3.5 w-3.5" aria-hidden /> Not saved
        </span>
      );
    default:
      return null;
  }
}
