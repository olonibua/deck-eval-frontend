'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export interface NavSection {
  title: string;
  links: Array<{ href: string; label: string; dot: string }>;
}

export function NavLinks({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' || href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-6 lg:overflow-visible lg:pb-0">
      {sections.map((section) => (
        <div key={section.title} className="flex gap-1 lg:block lg:space-y-1">
          <p className="stamp hidden px-3 pb-1 lg:block">{section.title}</p>
          {section.links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  active ? 'bg-fg font-medium text-page' : 'text-fg hover:bg-surface',
                )}
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', link.dot)} aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
