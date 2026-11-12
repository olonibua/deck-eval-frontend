'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TagDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useConfirm } from '../ui/dialog-provider';
import { Input } from '../ui/form';

export const TAG_PALETTE = [
  { name: 'Blue', value: '#4176C5' },
  { name: 'Sky', value: '#8DD0FB' },
  { name: 'Teal', value: '#8FD1DC' },
  { name: 'Pink', value: '#F3B2AF' },
  { name: 'Magenta', value: '#C4597C' },
  { name: 'Lime', value: '#DCE88C' },
  { name: 'Yellow', value: '#F8E87D' },
  { name: 'Orange', value: '#EC905D' },
];

function Swatches({ value, onChange, label }: { value: string; onChange: (color: string) => void; label: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {TAG_PALETTE.map((c) => (
        <button
          key={c.value}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === c.value.toLowerCase()}
          aria-label={c.name}
          onClick={() => onChange(c.value)}
          className={cn('h-6 w-6 rounded-full border-2 ring-1 ring-border-strong/60', value.toLowerCase() === c.value.toLowerCase() ? 'border-fg' : 'border-surface')}
          style={{ background: c.value }}
        />
      ))}
    </div>
  );
}

export function TagsManager({ tags }: { tags: TagDTO[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const [color, setColor] = useState(TAG_PALETTE[0].value);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <Card className="divide-y divide-border">
      {tags.map((tag) => (
        <div key={tag.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
          <span className="inline-flex min-w-40 flex-1 items-center gap-2 font-medium">
            <span className="h-3 w-3 rounded-full" style={{ background: tag.color }} aria-hidden />
            {tag.name}
          </span>
          <Swatches label={`Colour for ${tag.name}`} value={tag.color} onChange={(c) => run(() => api.patch(`/tags/${tag.id}`, { name: tag.name, color: c }), 'Tag updated')} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${tag.name}`}
            onClick={async () => {
              const ok = await confirm({
                title: `Delete the "${tag.name}" tag?`,
                description: 'It will be removed from every task that uses it.',
                confirmLabel: 'Delete tag',
                destructive: true,
              });
              if (ok) void run(() => api.delete(`/tags/${tag.id}`), 'Tag deleted');
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <form
        className="flex flex-wrap items-center gap-4 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          void run(() => api.post('/tags', { name: name.trim(), color }), 'Tag created').then(() => setName(''));
        }}
      >
        <Input className="min-w-40 flex-1" placeholder="New tag" value={name} onChange={(e) => setName(e.target.value)} aria-label="New tag name" />
        <Swatches label="Colour for new tag" value={color} onChange={setColor} />
        <Button type="submit" variant="secondary" disabled={!name.trim()}>
          Add tag
        </Button>
      </form>
    </Card>
  );
}
