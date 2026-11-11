import type { WorkspaceDTO } from '@/lib/shared';
import { Workspace } from '@/components/workspace/workspace';
import { serverApi } from '@/lib/server-api';

export default async function TaskWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverApi<WorkspaceDTO>(`/tasks/${id}/workspace`);
  return <Workspace key={data.submission?.id ?? 'unclaimed'} data={data} mode="rate" backHref="/" />;
}
