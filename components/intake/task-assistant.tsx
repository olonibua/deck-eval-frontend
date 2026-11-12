'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ProjectDTO, TagDTO, TaskDraft } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { SegmentedTabs } from '../workspace/segmented-tabs';
import { AiChat } from './ai-chat';
import { SmartImport } from './smart-import';

type Mode = 'chat' | 'import';

export function TaskAssistant({ aiEnabled, projects, tags }: { aiEnabled: boolean; projects: ProjectDTO[]; tags: TagDTO[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('chat');

  async function create(draft: TaskDraft, viaAi: boolean): Promise<boolean> {
    try {
      const { taskId } = await api.post<{ taskId: string }>('/admin/intake/tasks', { draft, viaAi });
      toast.success('Draft task created. Check the slides, then publish.');
      router.push(`/admin/tasks/${taskId}/edit?step=4`);
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <SegmentedTabs
          label="How to add the task"
          active={mode}
          onChange={(id) => setMode(id as Mode)}
          items={[
            { id: 'chat', label: 'Chat with AI' },
            { id: 'import', label: 'Smart import' },
          ]}
        />
      </div>
      {mode === 'chat' ? (
        <AiChat aiEnabled={aiEnabled} projects={projects} tags={tags} onCreate={(d) => create(d, true)} onUseSmartImport={() => setMode('import')} />
      ) : (
        <SmartImport projects={projects} tags={tags} onCreate={(d) => create(d, false)} />
      )}
    </div>
  );
}
