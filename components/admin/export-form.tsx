'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { ProjectDTO } from '@/lib/shared';
import { Card } from '../ui/card';
import { Input, Label, Select } from '../ui/form';

export function ExportForm({ projects }: { projects: ProjectDTO[] }) {
  const [projectId, setProjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  const href = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({ format });
    if (projectId) params.set('projectId', projectId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (status) params.set('status', status);
    return `/api/admin/exports?${params.toString()}`;
  };

  return (
    <Card className="max-w-2xl space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="export-project">Project</Label>
          <Select id="export-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="export-status">Submission status</Label>
          <Select id="export-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Everything submitted</option>
            <option value="SUBMITTED">Awaiting review</option>
            <option value="RETURNED">Returned</option>
            <option value="APPROVED">Approved</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="export-from">Submitted from</Label>
          <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="export-to">Submitted to</Label>
          <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={href('csv')} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover">
          <Download className="h-4 w-4" aria-hidden /> Download CSV
        </a>
        <a href={href('json')} className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-subtle">
          <Download className="h-4 w-4" aria-hidden /> Download JSON
        </a>
      </div>
    </Card>
  );
}
