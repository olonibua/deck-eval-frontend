import type { WorkspaceDTO } from '@/lib/shared';
import { Workspace } from '@/components/workspace/workspace';
import { serverApi } from '@/lib/server-api';
import { requireRole } from '@/lib/session';

export default async function ReviewSubmissionPage({ params }: { params: Promise<{ submissionId: string }> }) {
  await requireRole(['ADMIN', 'REVIEWER']);
  const { submissionId } = await params;
  const data = await serverApi<WorkspaceDTO>(`/reviews/${submissionId}`);
  return <Workspace data={data} mode="review" backHref="/review" />;
}
