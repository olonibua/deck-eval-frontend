import type { ProjectDTO, TagDTO } from '@/lib/shared';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';
import { NewTaskForm } from './new-task-form';

export default async function NewTaskPage() {
  const [projects, tags] = await Promise.all([serverApi<ProjectDTO[]>('/projects'), serverApi<TagDTO[]>('/tags')]);
  return (
    <div>
      <PageHeader title="New task" meta="Step 1 of 5 · Basics" />
      <NewTaskForm projects={projects} tags={tags} />
    </div>
  );
}
