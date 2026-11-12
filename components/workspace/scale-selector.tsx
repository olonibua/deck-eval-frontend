'use client';

import { useRef } from 'react';
import type { FieldConfig } from '@/lib/shared';
import { cn } from '@/lib/cn';

export function ScaleSelector({
  id,
  label,
  config,
  value,
  onChange,
  readOnly,
  invalid,
}: {
  id: string;
  label: string;
  config: FieldConfig;
  value: number | null;
  onChange: (value: number) => void;
  readOnly?: boolean;
  invalid?: boolean;
}) {
  const min = config.min ?? 1;
  const max = config.max ?? 7;
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusIndex = value === null ? 0 : points.indexOf(value);

  function select(point: number, focus = false) {
    if (readOnly) return;
    onChange(point);
    if (focus) refs.current[points.indexOf(point)]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (readOnly) return;
    const digit = Number(event.key);
    if (Number.isInteger(digit) && points.includes(digit)) {
      event.preventDefault();
      select(digit, true);
      return;
    }
    const current = value ?? min - 1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      select(Math.min(max, Math.max(min, current + 1)), true);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      select(Math.max(min, current - 1), true);
    }
  }

  const startLabel = config.labels?.[String(min)];
  const endLabel = config.labels?.[String(max)];

  return (
    <div className="inline-flex flex-col">
      <div
        role="radiogroup"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-readonly={readOnly || undefined}
        className="flex flex-wrap gap-1.5"
        onKeyDown={onKeyDown}
      >
        {points.map((point, index) => {
          const selected = value === point;
          return (
            <button
              key={point}
              ref={(el) => {
                refs.current[index] = el;
              }}
              id={index === 0 ? id : undefined}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${point}${config.labels?.[String(point)] ? `, ${config.labels[String(point)]}` : ''}`}
              tabIndex={index === Math.max(0, focusIndex) ? 0 : -1}
              disabled={readOnly && !selected}
              onClick={() => select(point)}
              className={cn(
                'h-10 w-10 rounded-sm border-[1.5px] text-sm font-semibold transition-colors duration-150',
                selected
                  ? 'border-fg bg-fg text-page'
                  : 'border-border-strong bg-surface text-fg hover:bg-yellow',
                invalid && !selected && 'border-danger',
                readOnly && 'cursor-default',
                readOnly && !selected && 'opacity-50',
              )}
            >
              {point}
            </button>
          );
        })}
      </div>
      {(startLabel || endLabel) && (
        <div className="mt-1 flex text-meta text-fg-subtle">
          <span>{startLabel}</span>
          <span className="ml-auto">{endLabel}</span>
        </div>
      )}
    </div>
  );
}
