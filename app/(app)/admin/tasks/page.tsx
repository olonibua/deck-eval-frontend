import Link from 'next/link';
import { ClipboardList, Plus, Sparkles } from 'lucide-react';
import type { ProjectDTO, TagDTO, TaskSummaryDTO } from '@/lib/shared';
import { FilterBar } from '@/components/filter-bar';
import { PriorityBadge, StatusBadge, TagChip } from '@/components/ui/badges';
import { Card, PageHeader, tableHead } from '@/components/ui/card';
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
        eyebrow="Admin"
        title="Tasks"
        meta={`${tasks.length} tasks`}
        actions={
          <>
            <Link
              href="/admin/tasks/new"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-surface px-4 text-sm font-medium shadow-[inset_0_0_0_1.5px_var(--ink)] transition hover:-translate-y-px"
            >
              <Plus className="h-4 w-4" aria-hidden /> New task
            </Link>
            <Link
              href="/admin/tasks/assistant"
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-yellow px-4 text-sm font-medium text-cocoa transition hover:-translate-y-px"
            >
              <Sparkles className="h-4 w-4" aria-hidden /> New task from files
            </Link>
          </>
        }
      />
      <FilterBar
        search
        filters={[
          {
            name: 'status',
            label: 'Status',
            options: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].map((s) => ({ value: s, label: s.replace('_', ' ').toLowerCase() })),
            allLabel: 'All statuses',
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
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="hidden sm:table-cell px-4 py-3 font-semibold">Raters</th>
                <th className="hidden md:table-cell px-4 py-3 font-semibold">Due</th>
                <th className="hidden md:table-cell px-4 py-3 font-semibold">Updated</th>
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
                      <span className="sm:hidden">
                        · {task.submissionCount}/{task.ratersNeeded} raters
                      </span>
                      {task.tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 tabular-nums">
                    {task.submissionCount} / {task.ratersNeeded}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-fg-muted">{formatDate(task.dueAt)}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-fg-muted">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
