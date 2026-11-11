'use client';

import { useState } from 'react';
import type { RankingValue } from '@/lib/shared';
import { Button } from '@/components/ui/button';
import { PriorityBadge, ResponseChip, StatusBadge, TagChip } from '@/components/ui/badges';
import { Card } from '@/components/ui/card';
import { FileChip } from '@/components/ui/file-chip';
import { RankPicker } from '@/components/workspace/rank-picker';
import { RationaleField } from '@/components/workspace/rationale-field';
import { SaveIndicator } from '@/components/workspace/save-indicator';
import { ScaleSelector } from '@/components/workspace/scale-selector';
import { SegmentedTabs } from '@/components/workspace/segmented-tabs';

const responses = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
];

export function DesignShowcase() {
  const [tab, setTab] = useState('a');
  const [score, setScore] = useState<number | null>(5);
  const [text, setText] = useState('Clear headline on slide 2, but the chart on slide 4 has no axis labels.');
  const [ranking, setRanking] = useState<RankingValue>({ rank1: 'b' });

  return (
    <section className="space-y-6">
      <h2 className="text-section font-semibold">Components</h2>
      <Card className="flex flex-wrap items-center gap-2 p-4">
        <Button>Submit</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Unclaim</Button>
        <Button variant="danger">Delete</Button>
        <Button loading>Saving</Button>
      </Card>
      <Card className="flex flex-wrap items-center gap-2 p-4">
        {(['DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'APPROVED'] as const).map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
        <PriorityBadge priority={1} />
        <PriorityBadge priority={2} />
        <PriorityBadge priority={3} />
        <TagChip tag={{ id: '1', name: 'Finance', color: '#2B4C7E' }} />
        {['A', 'B', 'C', 'D'].map((l) => (
          <ResponseChip key={l} label={l} />
        ))}
      </Card>
      <Card className="space-y-4 p-4">
        <SegmentedTabs
          label="Example tabs"
          active={tab}
          onChange={setTab}
          items={[
            { id: 'a', label: 'Response A', completion: 'done' },
            { id: 'b', label: 'Response B', completion: 'partial' },
            { id: 'c', label: 'Response C', completion: 'empty' },
          ]}
        />
        <ScaleSelector id="demo-scale" label="Demo scale" config={{ min: 1, max: 7, labels: { '1': 'Poor', '7': 'Excellent' } }} value={score} onChange={setScore} />
        <RationaleField id="demo-text" label="Demo explanation" config={{ minChars: 40, maxChars: 2000, placeholder: 'Briefly explain the content quality score' }} value={text} onChange={setText} independenceCheck />
        <RankPicker id="demo-rank" responses={responses} value={ranking} onChange={setRanking} required />
        <div className="flex flex-wrap gap-4">
          <SaveIndicator state={{ kind: 'saving' }} />
          <SaveIndicator state={{ kind: 'saved', at: new Date() }} />
          <SaveIndicator state={{ kind: 'offline' }} />
        </div>
        <FileChip file={{ id: 'f', name: 'Q3-figures.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 48211, url: '#' }} />
      </Card>
    </section>
  );
}
