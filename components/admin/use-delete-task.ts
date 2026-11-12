'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { useConfirm, usePrompt } from '../ui/dialog-provider';

interface DeletableTask {
  id: string;
  title: string;
  submissionCount: number;
}

const CONFIRM_WORD = 'delete';

export function useDeleteTask() {
  const router = useRouter();
  const confirm = useConfirm();
  const prompt = usePrompt();

  async function confirmed(task: DeletableTask): Promise<boolean> {
    if (task.submissionCount === 0) {
      return confirm({
        title: `Delete "${task.title}"?`,
        description: "The task, its responses and uploaded files will be removed. This can't be undone.",
        confirmLabel: 'Delete task',
        destructive: true,
      });
    }
    const plural = task.submissionCount === 1 ? 'submission' : 'submissions';
    const typed = await prompt({
      title: `Delete "${task.title}" and its ${task.submissionCount} ${plural}?`,
      description: `This also deletes every rating, review and comment on it, and they will no longer appear in exports. This can't be undone. Type "${CONFIRM_WORD}" to confirm.`,
      label: `Type ${CONFIRM_WORD}`,
      placeholder: CONFIRM_WORD,
      confirmLabel: 'Delete task',
    });
    if (typed === null) return false;
    if (typed.trim().toLowerCase() !== CONFIRM_WORD) {
      toast.error(`Not deleted. Type "${CONFIRM_WORD}" exactly to confirm.`);
      return false;
    }
    return true;
  }

  return async function deleteTask(task: DeletableTask, after: 'list' | 'refresh' = 'list'): Promise<boolean> {
    if (!(await confirmed(task))) return false;
    try {
      await api.delete(`/admin/tasks/${task.id}`);
      toast.success(`Deleted "${task.title}"`);
      if (after === 'list') router.push('/admin/tasks');
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not delete the task');
      return false;
    }
  };
}
