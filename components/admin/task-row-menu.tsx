'use client';

import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { TaskSummaryDTO } from '@/lib/shared';
import { MoreMenu } from '../ui/more-menu';
import { useDeleteTask } from './use-delete-task';

export function TaskRowMenu({ task }: { task: TaskSummaryDTO }) {
  const router = useRouter();
  const deleteTask = useDeleteTask();
  return (
    <MoreMenu
      label={`Actions for ${task.title}`}
      items={[
        { label: 'Edit', icon: Pencil, onSelect: () => router.push(`/admin/tasks/${task.id}/edit`) },
        { label: 'Preview as rater', icon: Eye, onSelect: () => router.push(`/admin/tasks/${task.id}/preview`) },
        {
          label: 'Delete',
          icon: Trash2,
          hint: task.submissionCount ? `Also deletes ${task.submissionCount} ${task.submissionCount === 1 ? 'submission' : 'submissions'}` : undefined,
          onSelect: () => void deleteTask(task, 'refresh'),
        },
      ]}
    />
  );
}
