import type { ProjectDTO, TagDTO } from '@/lib/shared';
import { TaskAssistant } from '@/components/intake/task-assistant';
import { Card, PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function TaskAssistantPage() {
  const [projects, tags, status] = await Promise.all([
    serverApi<ProjectDTO[]>('/projects'),
    serverApi<TagDTO[]>('/tags'),
    serverApi<{ aiEnabled: boolean }>('/admin/intake/status'),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Admin · New task"
        title="Add a task from files"
        meta="Drop in everything you have for a task. It is filled in for you and saved as a draft for you to check."
      />
      {projects.length === 0 ? (
        <Card className="p-6 text-sm text-fg-muted">Create a project under Rubrics before adding tasks.</Card>
      ) : (
        <TaskAssistant aiEnabled={status.aiEnabled} projects={projects} tags={tags} />
      )}
    </div>
  );
}
