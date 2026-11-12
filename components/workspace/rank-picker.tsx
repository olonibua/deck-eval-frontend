'use client';

import { rankSlots, type RankingValue, type ResponseDTO } from '@/lib/shared';
import { cn } from '@/lib/cn';

export function RankPicker({
  id,
  responses,
  value,
  onChange,
  readOnly,
  required,
}: {
  id: string;
  responses: Pick<ResponseDTO, 'id' | 'label'>[];
  value: RankingValue;
  onChange: (value: RankingValue) => void;
  readOnly?: boolean;
  required?: boolean;
}) {
  const slots = rankSlots(responses);

  function pick(slot: string, responseId: string) {
    if (readOnly) return;
    const next = { ...value };
    if (next[slot] === responseId) delete next[slot];
    else next[slot] = responseId;
    onChange(next);
  }

  return (
    <div className="space-y-2" id={id}>
      {slots.map((slot, index) => (
        <div key={slot} className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={`Rank ${index + 1}`}>
          <span className="w-20 shrink-0 text-sm font-medium">
            Rank {index + 1}
            {required && <span className="text-danger"> *</span>}
          </span>
          {responses.map((response) => {
            const selected = value[slot] === response.id;
            const usedElsewhere = !selected && Object.entries(value).some(([s, id]) => s !== slot && id === response.id);
            return (
              <button
                key={response.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={readOnly && !selected}
                onClick={() => pick(slot, response.id)}
                className={cn(
                  'h-9 rounded-sm border-[1.5px] px-3 text-sm font-medium transition-colors',
                  selected
                    ? 'border-fg bg-fg text-page'
                    : 'border-border-strong bg-surface text-fg hover:bg-yellow',
                  usedElsewhere && 'border-dashed text-fg-subtle opacity-60',
                  readOnly && 'cursor-default',
                )}
                aria-label={`Response ${response.label}${usedElsewhere ? ', already ranked' : ''}`}
              >
                Response {response.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
