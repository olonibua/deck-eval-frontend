import Link from 'next/link';
import { StatTile } from '@/components/ui/stat-tile';
import type { StatsDTO, TaskStatus } from '@/lib/shared';
import { EscalationList, type EscalationItem } from '@/components/admin/escalation-list';
import { StatusBadge } from '@/components/ui/badges';
import { Card, PageHeader, tableHead } from '@/components/ui/card';
import { formatDuration } from '@/lib/format';
import { serverApi } from '@/lib/server-api';

const ORDER: TaskStatus[] = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

export default async function AdminOverviewPage() {
  const [stats, escalations] = await Promise.all([serverApi<StatsDTO>('/admin/stats'), serverApi<EscalationItem[]>('/admin/escalations')]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Overview" meta="How the queue, reviews and raters are doing right now." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile fill="yellow" label="Awaiting review" value={stats.awaitingReview} note="Submitted and waiting" href="/review" />
        <StatTile fill="lime" label="Average active time" value={formatDuration(stats.avgActiveSeconds)} note="Per submission" />
        <StatTile fill="sky" label="Tasks in progress" value={stats.tasksByStatus.IN_PROGRESS} note="Claimed by raters" href="/admin/tasks?status=IN_PROGRESS" />
        <StatTile fill="pink" label="Open escalations" value={escalations.length} note="Raters need a hand" />
      </div>
      <section>
        <h2 className="mb-4 text-section font-medium">Tasks by status</h2>
        <div className="flex flex-wrap gap-3">
          {ORDER.map((status) => (
            <Link key={status} href={`/admin/tasks?status=${status}`} className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 hover:bg-subtle">
              <StatusBadge status={status} />
              <span className="font-semibold tabular-nums">{stats.tasksByStatus[status]}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 text-section font-medium">Escalations</h2>
        <EscalationList items={escalations} />
      </section>
      <section>
        <h2 className="mb-4 text-section font-medium">Raters</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3 font-semibold">Rater</th>
                <th className="px-4 py-3 font-semibold">Awaiting review</th>
                <th className="px-4 py-3 font-semibold">Returned</th>
                <th className="px-4 py-3 font-semibold">Approved</th>
              </tr>
            </thead>
            <tbody>
              {stats.perRater.map((r) => (
                <tr key={r.userId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    {r.name ?? r.email} <span className="text-meta text-fg-subtle">{r.name ? r.email : ''}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.submitted}</td>
                  <td className="px-4 py-3 tabular-nums">{r.returned}</td>
                  <td className="px-4 py-3 tabular-nums">{r.approved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
