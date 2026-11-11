'use client';

import { ChevronDown } from 'lucide-react';
import type { TaskDetailDTO } from '@/lib/shared';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { cn } from '@/lib/cn';
import { Card } from '../ui/card';
import { FileChip } from '../ui/file-chip';

export function BriefCard({ task }: { task: TaskDetailDTO }) {
  const [collapsed, setCollapsed] = usePersistentState(`de:brief-collapsed:${task.id}`, false);
  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls="task-brief"
      >
        <span className="text-[15px] font-semibold">Task brief</span>
        <span className="flex items-center gap-1 text-meta text-fg-muted">
          {collapsed ? 'Show' : 'Hide'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {!collapsed && (
        <div id="task-brief" className="grid gap-6 border-t border-border px-5 py-5 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-meta font-semibold tracking-wide text-fg-muted uppercase">Instructions</h2>
            <div className="prose-brief" dangerouslySetInnerHTML={{ __html: task.instructions || '<p>No instructions.</p>' }} />
          </section>
          <section>
            <h2 className="mb-2 text-meta font-semibold tracking-wide text-fg-muted uppercase">User request</h2>
            <div className="prose-brief rounded-md bg-subtle p-3" dangerouslySetInnerHTML={{ __html: task.userRequest || '<p>No user request.</p>' }} />
            {task.inputFiles.length > 0 && (
              <>
                <h2 className="mt-5 mb-2 text-meta font-semibold tracking-wide text-fg-muted uppercase">Input files</h2>
                <div className="flex flex-wrap gap-2">
                  {task.inputFiles.map((file) => (
                    <FileChip key={file.id} file={file} />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </Card>
  );
}
