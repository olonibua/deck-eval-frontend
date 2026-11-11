import type { ProjectDTO } from '@/lib/shared';
import { ExportForm } from '@/components/admin/export-form';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function ExportsPage() {
  const projects = await serverApi<ProjectDTO[]>('/projects');
  return (
    <div>
      <PageHeader title="Export results" meta="CSV has one row per submission per response. JSON has the full nested structure, including reviews." />
      <ExportForm projects={projects} />
    </div>
  );
}
