import { CheckCircle2, ClipboardList, Undo2 } from 'lucide-react';
import type { DashboardDTO, DashboardItemDTO } from '@/lib/shared';
import { NextTaskCard } from '@/components/next-task-card';
import { TaskCard } from '@/components/task-card';
import { EmptyState } from '@/components/ui/empty-state';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';

function Section({ title, items, empty, icon }: { title: string; items: DashboardItemDTO[]; empty: string; icon: typeof ClipboardList }) {
  return (
    <section className="space-y-3">
      <h2 className="text-section font-semibold">
        {title} <span className="text-base font-normal text-fg-subtle">{items.length}</span>
      </h2>
      {items.length === 0 ? (
        <EmptyState icon={icon} text={empty} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-title font-semibold">Hi {user.name?.split(' ')[0] ?? 'there'}</h1>
        <p className="mt-1 text-meta text-fg-muted">Pick up where you left off or start something new.</p>
      </div>
      <NextTaskCard task={data.next} />
      <Section title="Returned to me" items={data.returned} empty="Nothing has been sent back to you." icon={Undo2} />
      <Section title="In progress" items={data.inProgress} empty="You have no tasks in progress." icon={ClipboardList} />
      <Section title="Completed" items={data.completed} empty="Tasks you submit will appear here." icon={CheckCircle2} />
    </div>
  );
}
