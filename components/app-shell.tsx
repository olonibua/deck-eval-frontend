import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { SessionUser } from '@/lib/shared';
import { NavLinks } from './nav-links';
import { SignOutButton } from './sign-out-button';

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const links = [{ href: '/', label: 'My tasks' }];
  if (user.role !== 'RATER') links.push({ href: '/review', label: 'Review' });
  if (user.role === 'ADMIN') {
    links.push(
      { href: '/admin', label: 'Overview' },
      { href: '/admin/tasks', label: 'Tasks' },
      { href: '/admin/templates', label: 'Rubrics' },
      { href: '/admin/users', label: 'Users' },
      { href: '/admin/tags', label: 'Tags' },
      { href: '/admin/exports', label: 'Export' },
    );
  }
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Layers className="h-5 w-5 text-primary" aria-hidden />
            Deck Eval
          </Link>
          <NavLinks links={links} />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-meta text-fg-muted sm:inline">
              {user.name ?? user.email} · {user.role.toLowerCase()}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
