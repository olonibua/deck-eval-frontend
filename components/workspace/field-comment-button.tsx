'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { ReviewCommentDTO } from '@/lib/shared';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/form';

export interface CommentDraft {
  body: string;
  suggestedValue: string | number | null;
}

export function FieldCommentButton({
  comments,
  canAdd,
  suggestNumeric,
  onAdd,
  onDelete,
}: {
  comments: ReviewCommentDTO[];
  canAdd: boolean;
  suggestNumeric?: { min: number; max: number };
  onAdd?: (draft: CommentDraft) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
}) {
  const [body, setBody] = useState('');
  const [suggested, setSuggested] = useState('');
  const [busy, setBusy] = useState(false);

  if (!canAdd && comments.length === 0) return null;

  async function add() {
    if (!onAdd || !body.trim()) return;
    setBusy(true);
    try {
      const value = suggested.trim() === '' ? null : suggestNumeric ? Number(suggested) : suggested.trim();
      await onAdd({ body: body.trim(), suggestedValue: value });
      setBody('');
      setSuggested('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-fg-muted hover:bg-muted hover:text-fg',
          comments.length > 0 && 'text-info',
        )}
        aria-label={comments.length ? `${comments.length} reviewer comments` : 'Add a comment'}
      >
        <MessageSquare className="h-4 w-4" />
        {comments.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-info px-1 text-[10px] font-bold text-white">
            {comments.length}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 w-80 rounded-lg border border-border bg-surface p-3 shadow-pop"
        >
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {comments.length === 0 && <p className="text-sm text-fg-muted">No comments yet.</p>}
            {comments.map((c) => (
              <div key={c.id} className="rounded-md bg-subtle p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2 text-meta text-fg-muted">
                  <span className="font-medium text-fg">{c.reviewerName}</span>
                  <span className="flex items-center gap-1">
                    {formatDateTime(c.createdAt)}
                    {onDelete && c.draft && (
                      <button
                        type="button"
                        className="rounded-sm p-0.5 hover:text-danger"
                        aria-label="Delete comment"
                        onClick={() => void onDelete(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                {c.suggestedValue !== null && c.suggestedValue !== undefined && (
                  <p className="mt-1.5 text-meta text-fg-muted">
                    Suggested: <span className="font-semibold text-fg">{String(c.suggestedValue)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          {canAdd && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <Textarea rows={3} placeholder="Comment for the rater" value={body} onChange={(e) => setBody(e.target.value)} aria-label="Comment" />
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 text-sm"
                  type={suggestNumeric ? 'number' : 'text'}
                  min={suggestNumeric?.min}
                  max={suggestNumeric?.max}
                  placeholder={suggestNumeric ? `Suggested score (${suggestNumeric.min}–${suggestNumeric.max})` : 'Suggested value (optional)'}
                  value={suggested}
                  onChange={(e) => setSuggested(e.target.value)}
                  aria-label="Suggested value"
                />
                <Button size="sm" onClick={add} loading={busy} disabled={!body.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
