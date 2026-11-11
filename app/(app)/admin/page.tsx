import Link from 'next/link';
import type { StatsDTO, TaskStatus } from '@/lib/shared';
import { EscalationList, type EscalationItem } from '@/components/admin/escalation-list';
import { StatusBadge } from '@/components/ui/badges';
import { Card, PageHeader } from '@/components/ui/card';
import { formatDuration } from '@/lib/format';
import { serverApi } from '@/lib/server-api';

const ORDER: TaskStatus[] = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const body = (
    <Card className="h-full p-4 transition-colors hover:bg-subtle">
      <p className="text-meta text-fg-muted">{label}</p>
      <p className="mt-1 text-[28px] font-semibold tabular-nums">{value}</p>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminOverviewPage() {
  const [stats, escalations] = await Promise.all([serverApi<StatsDTO>('/admin/stats'), serverApi<EscalationItem[]>('/admin/escalations')]);
  return (
    <div className="space-y-8">
      <PageHeader title="Overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Awaiting review" value={stats.awaitingReview} href="/review" />
        <Stat label="Average active time" value={formatDuration(stats.avgActiveSeconds)} />
        <Stat label="Tasks in progress" value={stats.tasksByStatus.IN_PROGRESS} href="/admin/tasks?status=IN_PROGRESS" />
        <Stat label="Open escalations" value={escalations.length} />
      </div>
      <section>
        <h2 className="mb-3 text-section font-semibold">Tasks by status</h2>
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
        <h2 className="mb-3 text-section font-semibold">Escalations</h2>
        <EscalationList items={escalations} />
      </section>
      <section>
        <h2 className="mb-3 text-section font-semibold">Raters</h2>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-meta text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Rater</th>
                <th className="px-4 py-3 font-medium">Awaiting review</th>
                <th className="px-4 py-3 font-medium">Returned</th>
                <th className="px-4 py-3 font-medium">Approved</th>
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
