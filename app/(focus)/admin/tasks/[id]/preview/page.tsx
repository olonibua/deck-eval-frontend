import type { WorkspaceDTO } from '@/lib/shared';
import { Workspace } from '@/components/workspace/workspace';
import { serverApi } from '@/lib/server-api';
import { requireRole } from '@/lib/session';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ADMIN']);
  const { id } = await params;
  const data = await serverApi<WorkspaceDTO>(`/admin/tasks/${id}/preview`);
  return <Workspace data={data} mode="preview" backHref={`/admin/tasks/${id}/edit`} />;
}
