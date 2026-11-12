'use client';

import { useLayoutEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { findComparativeWords, type FieldConfig } from '@/lib/shared';
import { cn } from '@/lib/cn';

const MIN_HEIGHT = 96;
const MAX_HEIGHT = 320;

export function RationaleField({
  id,
  label,
  config,
  value,
  onChange,
  readOnly,
  invalid,
  independenceCheck,
}: {
  id: string;
  label: string;
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  invalid?: boolean;
  independenceCheck?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight + 2))}px`;
  }, [value]);

  const length = value.trim().length;
  const short = config.minChars ? length < config.minChars : false;
  const warnings = independenceCheck && value ? findComparativeWords(value) : [];

  return (
    <div>
      <div className="relative">
        <textarea
          ref={ref}
          id={id}
          aria-label={label}
          aria-invalid={invalid || undefined}
          readOnly={readOnly}
          value={value}
          maxLength={config.maxChars}
          placeholder={readOnly ? '' : config.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'block w-full resize-none rounded-lg border-[1.5px] bg-surface px-3 pt-2 pb-6 text-[15px] leading-[1.5] text-fg transition-colors',
            invalid ? 'border-danger' : 'border-border-strong hover:border-fg-subtle focus-visible:border-fg',
            readOnly && 'bg-subtle',
          )}
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
        <span
          className={cn('pointer-events-none absolute right-2.5 bottom-1.5 text-[12px] tabular-nums', short ? 'font-medium text-fg-muted' : 'text-fg-subtle')}
          aria-live="polite"
        >
          {length}
          {config.maxChars ? ` / ${config.maxChars}` : ''}
          {short && config.minChars ? ` · min ${config.minChars}` : ''}
        </span>
      </div>
      {warnings.length > 0 && (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-sm bg-yellow px-2.5 py-1.5 text-[13px] text-cocoa" role="status">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            This reads as a comparison ({warnings.join(', ')}). The instructions ask you to rate each response on its own.
          </span>
        </p>
      )}
    </div>
  );
}
