import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { DialogProvider } from '@/components/ui/dialog-provider';
import './globals.css';

export const metadata: Metadata = { title: 'Deck Eval', description: 'Slide-deck evaluation tasks' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <DialogProvider>{children}</DialogProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
