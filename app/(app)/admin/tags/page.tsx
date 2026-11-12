import type { TagDTO } from '@/lib/shared';
import { TagsManager } from '@/components/admin/tags-manager';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function TagsPage() {
  const tags = await serverApi<TagDTO[]>('/tags');
  return (
    <div>
      <PageHeader eyebrow="Admin" title="Tags" meta="Colour-coded labels for filtering tasks." />
      <TagsManager tags={tags} />
    </div>
  );
}
