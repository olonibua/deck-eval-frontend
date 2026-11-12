'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export interface NavSection {
  title: string;
  links: Array<{ href: string; label: string; dot: string }>;
}

export function NavLinks({ sections, stacked = false }: { sections: NavSection[]; stacked?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' || href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Main" className={cn('space-y-6 px-3', !stacked && 'hidden lg:block')}>
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="stamp px-3 pb-1">{section.title}</p>
          {section.links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm whitespace-nowrap transition-colors lg:py-2',
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
