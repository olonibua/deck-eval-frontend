import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ClipboardList } from 'lucide-react';
import type { UserDetailDTO } from '@/lib/shared';
import { PriorityBadge, StatusBadge } from '@/components/ui/badges';
import { Card, PageHeader, tableHead, tableRow } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatTile } from '@/components/ui/stat-tile';
import { formatDate, formatDateTime, formatDuration } from '@/lib/format';
import { serverApi } from '@/lib/server-api';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, counts, totalActiveSeconds, tasks } = await serverApi<UserDetailDTO>(`/admin/users/${id}`);
  const name = user.name ?? user.email;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All users
        </Link>
        <PageHeader
          eyebrow={`${user.role.toLowerCase()}${user.active ? '' : ' · deactivated'}`}
          title={name}
          meta={`${user.email} · joined ${formatDate(user.createdAt)} · ${formatDuration(totalActiveSeconds)} active time in total`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile fill="yellow" label="In progress" value={counts.DRAFT} note="Claimed, not submitted" />
        <StatTile fill="sky" label="Awaiting review" value={counts.SUBMITTED} note="Submitted for checking" />
        <StatTile fill="pink" label="Returned" value={counts.RETURNED} note="Sent back for changes" />
        <StatTile fill="lime" label="Approved" value={counts.APPROVED} note="Signed off" />
      </div>

      <section className="space-y-4">
        <h2 className="text-section font-medium">
          Tasks <span className="text-base text-fg-subtle">{tasks.length}</span>
        </h2>
        {tasks.length === 0 ? (
          <EmptyState icon={ClipboardList} text={`${name} hasn't picked up any tasks yet.`} />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={tableHead}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="hidden md:table-cell px-4 py-3 font-semibold">Submitted</th>
                  <th className="hidden md:table-cell px-4 py-3 font-semibold">Last activity</th>
                  <th className="hidden sm:table-cell px-4 py-3 font-semibold">Active time</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.submissionId} className={tableRow}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/tasks/${task.taskId}/edit`} className="font-medium hover:underline">
                        {task.taskTitle}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5 text-meta text-fg-muted">
                        <PriorityBadge priority={task.priority} />
                        {task.projectName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-fg-muted">{formatDateTime(task.submittedAt)}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-fg-muted">{formatDateTime(task.updatedAt)}</td>
                    <td className="hidden sm:table-cell px-4 py-3 tabular-nums">{formatDuration(task.activeSeconds)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/review/${task.submissionId}`}
                        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap hover:underline"
                      >
                        Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
