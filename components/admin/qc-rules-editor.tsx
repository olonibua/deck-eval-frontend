'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { GuideDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { formatDate } from '@/lib/format';
import { SegmentedTabs } from '../workspace/segmented-tabs';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useConfirm } from '../ui/dialog-provider';
import { Textarea } from '../ui/form';

export function QcRulesEditor({ initial }: { initial: GuideDTO[] }) {
  const confirm = useConfirm();
  const [guides, setGuides] = useState(initial);
  const [activeKey, setActiveKey] = useState(initial[0]?.key ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(initial.map((g) => [g.key, g.body])));
  const [busy, setBusy] = useState(false);

  const guide = guides.find((g) => g.key === activeKey);
  if (!guide) return null;
  const draft = drafts[guide.key] ?? guide.body;
  const changed = draft !== guide.body;

  function replace(updated: GuideDTO) {
    setGuides((current) => current.map((g) => (g.key === updated.key ? updated : g)));
    setDrafts((current) => ({ ...current, [updated.key]: updated.body }));
  }

  async function save() {
    setBusy(true);
    try {
      replace(await api.put<GuideDTO>(`/admin/guides/${guide!.key}`, { body: draft }));
      toast.success(`${guide!.title} saved`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const ok = await confirm({
      title: `Reset ${guide!.title}?`,
      description: 'This puts back the original text and removes your edits to this guide.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      replace(await api.post<GuideDTO>(`/admin/guides/${guide!.key}/reset`));
      toast.success(`${guide!.title} reset`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <SegmentedTabs
        label="Guides"
        active={activeKey}
        onChange={setActiveKey}
        items={guides.map((g) => ({ id: g.key, label: drafts[g.key] !== g.body ? `${g.title} •` : g.title }))}
      />
      <Card className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-fg-muted">
            {guide.isDefault ? 'Original text' : `Edited ${formatDate(guide.updatedAt)}`} · {draft.length.toLocaleString()} characters
          </p>
          <div className="flex gap-2">
            {!guide.isDefault && (
              <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
                Reset to original
              </Button>
            )}
            <Button size="sm" onClick={save} loading={busy} disabled={!changed || !draft.trim()}>
              Save
            </Button>
          </div>
        </div>
        <Textarea
          aria-label={guide.title}
          value={draft}
          onChange={(e) => setDrafts((current) => ({ ...current, [guide.key]: e.target.value }))}
          rows={22}
          spellCheck={false}
          className="font-mono text-[13px] leading-relaxed"
        />
      </Card>
    </div>
  );
}
