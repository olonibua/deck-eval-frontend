import { cn } from '@/lib/cn';

export function DocumentMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('h-6 w-6', className)} aria-hidden>
      <path d="M24 6h38l22 22v60a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8Z" fill="currentColor" />
      <path d="M62 6v16a6 6 0 0 0 6 6h16Z" fill="var(--ink-soft)" />
      <rect x="28" y="44" width="44" height="7" rx="3.5" fill="var(--bg-page)" />
      <rect x="28" y="58" width="44" height="7" rx="3.5" fill="var(--bg-page)" />
      <rect x="28" y="72" width="26" height="7" rx="3.5" fill="var(--bg-page)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[24px] leading-none font-semibold tracking-[-1px] text-fg', className)}>
      <DocumentMark className="h-7 w-7" />
      deck eval
    </span>
  );
}
