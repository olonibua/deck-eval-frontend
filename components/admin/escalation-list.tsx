'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flag } from 'lucide-react';
import { api } from '@/lib/client-api';
import { formatDateTime } from '@/lib/format';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { EmptyState } from '../ui/empty-state';

export interface EscalationItem {
  id: string;
  taskId: string;
  taskTitle: string;
  note: string;
  raterName: string;
  createdAt: string;
}

export function EscalationList({ items }: { items: EscalationItem[] }) {
  const router = useRouter();
  if (items.length === 0) return <EmptyState icon={Flag} text="No open escalations." />;
  return (
    <Card className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <Link href={`/admin/tasks/${item.taskId}/edit`} className="font-medium hover:underline">
              {item.taskTitle}
            </Link>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{item.note}</p>
            <p className="mt-1 text-meta text-fg-muted">
              {item.raterName} · {formatDateTime(item.createdAt)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await api.post(`/admin/escalations/${item.id}/resolve`);
              router.refresh();
            }}
          >
            Mark resolved
          </Button>
        </div>
      ))}
    </Card>
  );
}
