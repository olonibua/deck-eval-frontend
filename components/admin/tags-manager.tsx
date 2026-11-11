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
import { Input } from '../ui/form';

export const TAG_PALETTE = [
  { name: 'Green', value: '#2F6B4F' },
  { name: 'Navy', value: '#2B4C7E' },
  { name: 'Rust', value: '#8A4B2C' },
  { name: 'Plum', value: '#6B4C8A' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Amber', value: '#B45309' },
  { name: 'Red', value: '#B91C1C' },
  { name: 'Emerald', value: '#15803D' },
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
          className={cn('h-6 w-6 rounded-full border-2', value.toLowerCase() === c.value.toLowerCase() ? 'border-fg' : 'border-transparent')}
          style={{ background: c.value }}
        />
      ))}
    </div>
  );
}

export function TagsManager({ tags }: { tags: TagDTO[] }) {
  const router = useRouter();
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
            onClick={() => window.confirm(`Delete the tag "${tag.name}"? It will be removed from every task.`) && run(() => api.delete(`/tags/${tag.id}`), 'Tag deleted')}
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
