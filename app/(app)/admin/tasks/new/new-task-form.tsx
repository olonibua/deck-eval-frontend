'use client';

import { useRouter } from 'next/navigation';
import type { ProjectDTO, TagDTO, TaskDetailDTO } from '@/lib/shared';
import { BasicsForm, basicsFromTask } from '@/components/admin/basics-form';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/client-api';

export function NewTaskForm({ projects, tags }: { projects: ProjectDTO[]; tags: TagDTO[] }) {
  const router = useRouter();
  if (projects.length === 0) {
    return <Card className="p-6 text-sm text-fg-muted">Create a project under Rubrics before adding tasks.</Card>;
  }
  return (
    <Card className="p-6">
      <BasicsForm
        initial={basicsFromTask(undefined, projects)}
        projects={projects}
        tags={tags}
        submitLabel="Create and continue"
        onSubmit={async (payload) => {
          const task = await api.post<TaskDetailDTO>('/admin/tasks', payload);
          router.push(`/admin/tasks/${task.id}/edit?step=2`);
        }}
      />
    </Card>
  );
}
