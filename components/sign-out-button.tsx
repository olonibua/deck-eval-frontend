'use client';

import { LogOut } from 'lucide-react';
import { api } from '@/lib/client-api';
import { Button } from './ui/button';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await api.post('/auth/logout');
        window.location.href = '/login';
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
