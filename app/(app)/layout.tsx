import { AppShell } from '@/components/app-shell';
import { getSession } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  return <AppShell user={user}>{children}</AppShell>;
}
