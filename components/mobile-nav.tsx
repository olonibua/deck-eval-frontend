'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as RadixDialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import { Logo } from './ui/logo';
import { NavLinks, type NavSection } from './nav-links';
import { SignOutButton } from './sign-out-button';

export function MobileNav({ sections, account }: { sections: NavSection[]; account: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <RadixDialog.Trigger className="inline-flex h-10 w-10 items-center justify-center rounded-md text-fg hover:bg-surface" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <RadixDialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,85vw)] flex-col bg-page shadow-pop" aria-describedby={undefined}>
          <div className="flex items-center justify-between px-5 py-4">
            <RadixDialog.Title asChild>
              <Link href="/" aria-label="Deck Eval home">
                <Logo />
              </Link>
            </RadixDialog.Title>
            <RadixDialog.Close className="rounded-md p-2 text-fg-muted hover:bg-muted" aria-label="Close menu">
              <X className="h-5 w-5" />
            </RadixDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            <NavLinks sections={sections} stacked />
          </div>
          <div className="border-t border-border p-3">
            {account}
            <SignOutButton />
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
