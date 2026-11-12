'use client';

import { LogOut } from 'lucide-react';
import { api } from '@/lib/client-api';

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await api.post('/auth/logout');
        window.location.href = '/login';
      }}
      className="mt-2 inline-flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm text-fg-muted transition-colors hover:bg-surface hover:text-fg"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  );
}
