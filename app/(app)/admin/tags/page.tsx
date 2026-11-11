import type { TagDTO } from '@/lib/shared';
import { TagsManager } from '@/components/admin/tags-manager';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function TagsPage() {
  const tags = await serverApi<TagDTO[]>('/tags');
  return (
    <div>
      <PageHeader title="Tags" />
      <TagsManager tags={tags} />
    </div>
  );
}
