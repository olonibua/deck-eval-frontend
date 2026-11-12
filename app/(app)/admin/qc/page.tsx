import type { GuideDTO } from '@/lib/shared';
import { QcRulesEditor } from '@/components/admin/qc-rules-editor';
import { PageHeader } from '@/components/ui/card';
import { serverApi } from '@/lib/server-api';

export default async function AiRulesPage() {
  const guides = await serverApi<GuideDTO[]>('/admin/guides');
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="AI rules" meta="The instructions the AI buttons in the rating screen follow. Edit them here when your rules change." />
      <section>
        <h2 className="text-section mb-1 font-medium">QC</h2>
        <p className="mb-4 text-sm text-fg-muted">The QC button follows these four guides when it scores each response and writes the rationales.</p>
        <QcRulesEditor initial={guides.filter((g) => g.group === 'qc')} />
      </section>
      <section>
        <h2 className="text-section mb-1 font-medium">Humanise</h2>
        <p className="mb-4 text-sm text-fg-muted">
          ChatGPT humanise follows its own prompt. Human humanise follows Write like me and your writing sample. Both are scored with Humanise check and rewritten until they reach 10/10 with every key point kept.
        </p>
        <QcRulesEditor initial={guides.filter((g) => g.group === 'humanise')} />
      </section>
    </div>
  );
}
