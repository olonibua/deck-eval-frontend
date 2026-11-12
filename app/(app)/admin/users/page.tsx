import type { SessionUser, UserDTO } from '@/lib/shared';
import { UsersManager } from '@/components/admin/users-manager';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';
import { getSession } from '@/lib/session';

export default async function UsersPage() {
  const [users, me] = await Promise.all([serverApi<UserDTO[]>('/admin/users'), getSession()]);
  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" meta="Everyone with an account. Open a person to see the tasks they have worked on." />
      <UsersManager users={users} me={me as SessionUser} />
    </div>
  );
}
