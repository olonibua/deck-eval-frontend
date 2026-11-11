import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { Role, SessionUser } from '@/lib/shared';
import { serverApi } from './server-api';

export const getSession = cache(() => serverApi<SessionUser>('/auth/me'));

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSession();
  if (!roles.includes(user.role)) redirect('/');
  return user;
}
