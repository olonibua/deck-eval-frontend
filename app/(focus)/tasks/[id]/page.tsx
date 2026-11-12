import type { WorkspaceDTO } from '@/lib/shared';
import { Workspace } from '@/components/workspace/workspace';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';

export default async function TaskWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, user] = await Promise.all([serverApi<WorkspaceDTO>(`/tasks/${id}/workspace`), getSession()]);
  return <Workspace key={data.submission?.id ?? 'unclaimed'} data={data} mode="rate" backHref="/" canQc={user.role === 'ADMIN'} meId={user.id} />;
}
