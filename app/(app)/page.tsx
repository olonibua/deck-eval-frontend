import { CheckCircle2, ClipboardList, Undo2 } from 'lucide-react';
import type { DashboardDTO, DashboardItemDTO } from '@/lib/shared';
import { NextTaskCard } from '@/components/next-task-card';
import { TaskCard } from '@/components/task-card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatTile } from '@/components/ui/stat-tile';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';

function Section({ title, items, empty, icon }: { title: string; items: DashboardItemDTO[]; empty: string; icon: typeof ClipboardList }) {
  return (
    <section className="space-y-4">
      <h2 className="text-section font-medium">
        {title} <span className="text-base text-fg-subtle">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <EmptyState icon={icon} text={empty} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <TaskCard key={item.task.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const [user, data] = await Promise.all([getSession(), serverApi<DashboardDTO>('/dashboard')]);
  const approved = data.completed.filter((i) => i.submissionStatus === 'APPROVED').length;
  return (
    <div className="space-y-12">
      <div>
        <p className="stamp mb-2">A good day to rate</p>
        <h1 className="text-display font-medium">Hi {user.name?.split(' ')[0] ?? 'there'}, one deck at a time.</h1>
        <p className="mt-3 text-[15px] text-fg-muted">Pick up where you left off, or start something new.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile fill="yellow" label="In progress" value={data.inProgress.length} note="Drafts saved as you go" />
        <StatTile fill="pink" label="Returned to me" value={data.returned.length} note="Check the reviewer notes" />
        <StatTile fill="lime" label="Submitted" value={data.completed.length} note={`${approved} approved`} />
        <StatTile fill="sky" label="Up next" value={data.next ? 1 : 0} note={data.next ? 'Ready to start' : 'Queue is clear'} />
      </div>
      <NextTaskCard task={data.next} />
      <Section title="Returned to me" items={data.returned} empty="Nothing has been sent back to you." icon={Undo2} />
      <Section title="In progress" items={data.inProgress} empty="You have no tasks in progress." icon={ClipboardList} />
      <Section title="Completed" items={data.completed} empty="Tasks you submit will appear here." icon={CheckCircle2} />
    </div>
  );
}
