import type { JobDTO } from '@/lib/shared';
import { api } from './client-api';

const POLL_MS = 3000;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runJob<T>(start: () => Promise<JobDTO<T>>): Promise<T> {
  let job = await start();
  while (job.status === 'running') {
    await wait(POLL_MS);
    job = await api.get<JobDTO<T>>(`/admin/jobs/${job.id}`);
  }
  if (job.status === 'failed' || !job.result) throw new Error(job.error ?? 'Something went wrong. Try again.');
  return job.result;
}
