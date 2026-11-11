import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { ProjectDTO, TemplateDTO } from '@/lib/shared';
import { ProjectsPanel } from '@/components/admin/projects-panel';
import { Card, PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function TemplatesPage() {
  const [templates, projects] = await Promise.all([serverApi<TemplateDTO[]>('/admin/templates'), serverApi<ProjectDTO[]>('/projects')]);
  return (
    <div className="space-y-10">
      <div>
        <PageHeader
          title="Rubrics"
          meta="Each rubric is versioned. Editing one that already has submissions creates a new version."
          actions={
            <Link href="/admin/templates/new" className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4" aria-hidden /> New rubric
            </Link>
          }
        />
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-meta text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Rubric</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Fields</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-subtle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/templates/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">v{t.version}</td>
                  <td className="px-4 py-3">{t.fields.filter((f) => f.type !== 'SECTION').length}</td>
                  <td className="px-4 py-3">{t.submissionCount}</td>
                  <td className="px-4 py-3 text-fg-muted">{t.projectNames.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <ProjectsPanel projects={projects} templates={templates} />
    </div>
  );
}
