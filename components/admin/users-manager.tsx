'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Role, SessionUser, UserDTO } from '@/lib/shared';
import { api } from '@/lib/client-api';
import { ApiError } from '@/lib/errors';
import { formatDate } from '@/lib/format';
import { Button } from '../ui/button';
import { Card, tableHead } from '../ui/card';
import { useConfirm } from '../ui/dialog-provider';
import { Dialog, DialogClose, DialogContent } from '../ui/dialog';
import { Input, Label, Select } from '../ui/form';

const ROLES: Role[] = ['RATER', 'REVIEWER', 'ADMIN'];

export function UsersManager({ users, me }: { users: UserDTO[]; me: SessionUser }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('RATER');
  const [passwordFor, setPasswordFor] = useState<UserDTO | null>(null);
  const [password, setPassword] = useState('');

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      toast.success(message);
      router.refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Something went wrong');
      return false;
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await run(() => api.post('/admin/users', { email, name: name || undefined, role }), `Invite sent to ${email}`)) {
              setEmail('');
              setName('');
            }
          }}
        >
          <div className="min-w-56 flex-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="min-w-40">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.toLowerCase()}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Invite</Button>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name ?? '—'}</p>
                  <p className="text-meta text-fg-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Select
                    aria-label={`Role for ${user.email}`}
                    className="w-36"
                    value={user.role}
                    disabled={user.id === me.id}
                    onChange={(e) => run(() => api.patch(`/admin/users/${user.id}`, { role: e.target.value }), 'Role updated')}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3 text-fg-muted">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">{user.active ? 'Active' : <span className="text-fg-subtle">Deactivated</span>}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => setPasswordFor(user)}>
                    Set password
                  </Button>
                  {user.id !== me.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (user.active) {
                          const ok = await confirm({
                            title: `Deactivate ${user.name ?? user.email}?`,
                            description: 'They will be signed out and can no longer sign in. You can reactivate them later.',
                            confirmLabel: 'Deactivate',
                            destructive: true,
                          });
                          if (!ok) return;
                        }
                        void run(() => api.patch(`/admin/users/${user.id}`, { active: !user.active }), user.active ? 'User deactivated' : 'User reactivated');
                      }}
                    >
                      {user.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Dialog open={passwordFor !== null} onOpenChange={(open) => !open && setPasswordFor(null)}>
        <DialogContent title="Set password" description={passwordFor?.email}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (passwordFor && (await run(() => api.patch(`/admin/users/${passwordFor.id}`, { password }), 'Password updated'))) {
                setPasswordFor(null);
                setPassword('');
              }
            }}
          >
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
