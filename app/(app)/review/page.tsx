import Link from 'next/link';
import { Inbox } from 'lucide-react';
import type { ProjectDTO, ReviewQueueItemDTO, TagDTO } from '@/lib/shared';
import { FilterBar } from '@/components/filter-bar';
import { StatusBadge, TagChip } from '@/components/ui/badges';
import { Card, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDateTime } from '@/lib/format';
import { serverApi } from '@/lib/server-api';
import { requireRole } from '@/lib/session';

export default async function ReviewQueuePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole(['ADMIN', 'REVIEWER']);
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const [items, projects, tags] = await Promise.all([
    serverApi<ReviewQueueItemDTO[]>(`/reviews?${query}`),
    serverApi<ProjectDTO[]>('/projects'),
    serverApi<TagDTO[]>('/tags'),
  ]);

  return (
    <div>
      <PageHeader title="Review" meta={`${items.length} submissions`} />
      <FilterBar
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: [
              { value: 'SUBMITTED', label: 'Awaiting review' },
              { value: 'RETURNED', label: 'Returned' },
              { value: 'APPROVED', label: 'Approved' },
            ],
            allLabel: 'Awaiting review',
          },
          { name: 'projectId', label: 'Project', options: projects.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'tagId', label: 'Tag', options: tags.map((t) => ({ value: t.id, label: t.name })) },
        ]}
      />
      {items.length === 0 ? (
        <EmptyState icon={Inbox} text="Nothing to review right now." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-meta text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Rater</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.submissionId} className="border-b border-border last:border-0 hover:bg-subtle">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.taskTitle}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-meta text-fg-muted">
                      {item.projectName}
                      {item.tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.raterName ?? item.raterEmail}</td>
                  <td className="px-4 py-3 text-fg-muted">{formatDateTime(item.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/review/${item.submissionId}`} className="font-medium text-primary hover:underline">
                      {item.status === 'SUBMITTED' ? 'Review' : 'Open'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
