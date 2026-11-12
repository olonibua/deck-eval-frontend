'use client';

import { LogOut } from 'lucide-react';
import { api } from '@/lib/client-api';
import { cn } from '@/lib/cn';

export function SignOutButton({ compact }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await api.post('/auth/logout');
        window.location.href = '/login';
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-md text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg',
        compact ? 'h-9 px-2.5' : 'mt-2 h-9 w-full px-3',
      )}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  );
}
