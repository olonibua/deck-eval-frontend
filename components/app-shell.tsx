import Link from 'next/link';
import type { SessionUser } from '@/lib/shared';
import { Logo } from './ui/logo';
import { MobileNav } from './mobile-nav';
import { NavLinks, type NavSection } from './nav-links';
import { SignOutButton } from './sign-out-button';

function sectionsFor(user: SessionUser): NavSection[] {
  const work: NavSection = {
    title: 'Work',
    links: [{ href: '/', label: 'My tasks', dot: 'bg-orange' }],
  };
  if (user.role !== 'RATER') work.links.push({ href: '/review', label: 'Review', dot: 'bg-blue' });
  if (user.role !== 'ADMIN') return [work];
  return [
    work,
    {
      title: 'Admin',
      links: [
        { href: '/admin', label: 'Overview', dot: 'bg-magenta' },
        { href: '/admin/tasks', label: 'Tasks', dot: 'bg-teal' },
        { href: '/admin/templates', label: 'Rubrics', dot: 'bg-pink' },
        { href: '/admin/qc', label: 'AI rules', dot: 'bg-yellow' },
        { href: '/admin/users', label: 'Users', dot: 'bg-sky' },
        { href: '/admin/tags', label: 'Tags', dot: 'bg-lime' },
        { href: '/admin/exports', label: 'Export', dot: 'bg-orange' },
      ],
    },
  ];
}

function initials(user: SessionUser) {
  const source = user.name ?? user.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function AccountCard({ user }: { user: SessionUser }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink text-[13px] font-semibold text-cocoa">{initials(user)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
        <p className="stamp mt-0.5">{user.role.toLowerCase()}</p>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const sections = sectionsFor(user);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-border bg-subtle/95 backdrop-blur lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:bg-subtle/70">
        <div className="flex items-center justify-between px-4 py-2 sm:px-5 lg:py-6">
          <Link href="/" aria-label="Deck Eval home">
            <Logo />
          </Link>
          <div className="lg:hidden">
            <MobileNav sections={sections} account={<AccountCard user={user} />} />
          </div>
        </div>
        <NavLinks sections={sections} />
        <div className="mt-auto hidden p-3 lg:block">
          <AccountCard user={user} />
          <SignOutButton />
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[1160px] min-w-0 px-4 py-6 sm:px-8 sm:py-8 lg:py-10">{children}</main>
    </div>
  );
}
