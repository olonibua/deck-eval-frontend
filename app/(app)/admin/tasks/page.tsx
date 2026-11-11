import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import type { ProjectDTO, TagDTO, TaskSummaryDTO } from '@/lib/shared';
import { FilterBar } from '@/components/filter-bar';
import { PriorityBadge, StatusBadge, TagChip } from '@/components/ui/badges';
import { Card, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/format';
import { serverApi } from '@/lib/server-api';

export default async function AdminTasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const [tasks, projects, tags] = await Promise.all([
    serverApi<TaskSummaryDTO[]>(`/admin/tasks?${query}`),
    serverApi<ProjectDTO[]>('/projects'),
    serverApi<TagDTO[]>('/tags'),
  ]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        meta={`${tasks.length} tasks`}
        actions={
          <Link href="/admin/tasks/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4" aria-hidden /> New task
          </Link>
        }
      />
      <FilterBar
        search
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].map((s) => ({ value: s, label: s.replace('_', ' ').toLowerCase() })),
          },
          { name: 'projectId', label: 'Project', options: projects.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'tagId', label: 'Tag', options: tags.map((t) => ({ value: t.id, label: t.name })) },
          { name: 'priority', label: 'Priority', options: [1, 2, 3].map((p) => ({ value: String(p), label: `P${p}` })), allLabel: 'All priorities' },
        ]}
      />
      {tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} text="No tasks match these filters." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-meta text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Raters</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border last:border-0 hover:bg-subtle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tasks/${task.id}/edit`} className="font-medium hover:underline">
                      {task.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-meta text-fg-muted">
                      <PriorityBadge priority={task.priority} />
                      {task.projectName} · {task.responseCount} responses
                      {task.tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {task.submissionCount} / {task.ratersNeeded}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{formatDate(task.dueAt)}</td>
                  <td className="px-4 py-3 text-fg-muted">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
