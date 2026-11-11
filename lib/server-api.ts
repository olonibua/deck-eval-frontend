import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { toApiError } from './errors';

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export async function serverApi<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_URL}${path}`, { headers: { cookie: cookieHeader }, cache: 'no-store' });
  if (res.status === 401) redirect('/login');
  if (res.status === 404 || res.status === 403) notFound();
  if (!res.ok) throw await toApiError(res);
  return res.json() as Promise<T>;
}
