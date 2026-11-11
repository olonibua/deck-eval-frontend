import type { TemplateDTO } from '@/lib/shared';
import { TemplateBuilder } from '@/components/admin/template-builder';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await serverApi<TemplateDTO>(`/admin/templates/${id}`);
  return (
    <div>
      <PageHeader title={template.name} meta={`Version ${template.version} · ${template.submissionCount} ${template.submissionCount === 1 ? 'submission' : 'submissions'}`} />
      <TemplateBuilder key={template.id} template={template} />
    </div>
  );
}
