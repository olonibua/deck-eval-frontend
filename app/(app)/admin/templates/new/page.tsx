import { TemplateBuilder } from '@/components/admin/template-builder';
import { PageHeader } from '@/components/ui/card';

export default function NewTemplatePage() {
  return (
    <div>
      <PageHeader title="New rubric" />
      <TemplateBuilder template={null} />
    </div>
  );
}
