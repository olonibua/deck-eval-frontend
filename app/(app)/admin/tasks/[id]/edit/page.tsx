import type { ProjectDTO, TagDTO, TaskDetailDTO, TemplateDTO, UserDTO } from '@/lib/shared';
import { TaskBuilder } from '@/components/admin/task-builder';
import { serverApi } from '@/lib/server-api';

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await serverApi<TaskDetailDTO>(`/admin/tasks/${id}`);
  const [projects, tags, users, template] = await Promise.all([
    serverApi<ProjectDTO[]>('/projects'),
    serverApi<TagDTO[]>('/tags'),
    serverApi<UserDTO[]>('/admin/users'),
    serverApi<TemplateDTO>(`/admin/templates/${task.templateVersionId}`),
  ]);
  return (
    <TaskBuilder
      key={task.id}
      initialTask={task}
      projects={projects}
      tags={tags}
      raters={users.filter((u) => u.active && u.role === 'RATER')}
      fields={template.fields}
    />
  );
}
