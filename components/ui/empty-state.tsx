import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, text, action }: { icon: LucideIcon; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed border-border-strong bg-surface/50 px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-fg-subtle" aria-hidden />
      <p className="text-sm text-fg-muted">{text}</p>
      {action}
    </div>
  );
}
