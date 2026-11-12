'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ProjectDTO, TemplateDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input, Select } from '../ui/form';

export function ProjectsPanel({ projects, templates }: { projects: ProjectDTO[]; templates: TemplateDTO[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '');

  async function save(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save');
    }
  }

  const templateLabel = (t: TemplateDTO) => `${t.name} · v${t.version}`;

  return (
    <section>
      <h2 className="mb-1 text-section font-medium">Projects</h2>
      <p className="mb-4 text-meta text-fg-muted">A project groups tasks that share a rubric. New tasks use the project&apos;s current rubric.</p>
      <Card className="divide-y divide-border">
        {projects.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-40 flex-1 font-medium">
              {p.name} <span className="text-meta font-normal text-fg-muted">· {p.taskCount} tasks</span>
            </span>
            <Select
              aria-label={`Rubric for ${p.name}`}
              className="w-72"
              value={p.templateId}
              onChange={(e) => save(() => api.patch(`/projects/${p.id}`, { name: p.name, templateId: e.target.value }), 'Project updated')}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {templateLabel(t)}
                </option>
              ))}
            </Select>
          </div>
        ))}
        <form
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !templateId) return;
            void save(() => api.post('/projects', { name: name.trim(), templateId }), 'Project created').then(() => setName(''));
          }}
        >
          <Input className="min-w-40 flex-1" placeholder="New project name" value={name} onChange={(e) => setName(e.target.value)} aria-label="New project name" />
          <Select aria-label="Rubric for new project" className="w-72" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {templateLabel(t)}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" disabled={!name.trim()}>
            Create project
          </Button>
        </form>
      </Card>
    </section>
  );
}
