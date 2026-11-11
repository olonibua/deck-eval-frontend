'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function NavLinks({ links }: { links: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' || href === '/admin' ? pathname === href : pathname.startsWith(href));
  return (
    <nav className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto" aria-label="Main">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          className={cn(
            'rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-fg-muted transition-colors hover:bg-muted hover:text-fg',
            isActive(link.href) && 'bg-muted font-medium text-fg',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
