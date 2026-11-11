import { DesignShowcase } from './showcase';

const TOKENS = [
  ['--bg-page', 'App background'],
  ['--bg-surface', 'Cards, panels'],
  ['--bg-subtle', 'Slide card well'],
  ['--bg-muted', 'Segmented track'],
  ['--border', 'Border'],
  ['--border-strong', 'Strong border'],
  ['--text', 'Text'],
  ['--text-muted', 'Muted text'],
  ['--text-subtle', 'Placeholder'],
  ['--primary', 'Primary'],
  ['--primary-hover', 'Primary hover'],
  ['--primary-soft', 'Primary soft'],
  ['--info', 'Info'],
  ['--warn', 'Warn'],
  ['--danger', 'Danger'],
  ['--success', 'Success'],
  ['--resp-a', 'Response A'],
  ['--resp-b', 'Response B'],
  ['--resp-c', 'Response C'],
  ['--resp-d', 'Response D'],
];

export default function DesignPage() {
  return (
    <div className="space-y-10">
      <h1 className="text-title font-semibold">Design system</h1>
      <section>
        <h2 className="mb-3 text-section font-semibold">Colour tokens</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {TOKENS.map(([token, label]) => (
            <div key={token} className="overflow-hidden rounded-md border border-border bg-surface">
              <div className="h-14 border-b border-border" style={{ background: `var(${token})` }} />
              <div className="p-2">
                <p className="text-sm font-medium">{label}</p>
                <p className="font-mono text-[12px] text-fg-muted">{token}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="mb-3 text-section font-semibold">Type scale</h2>
        <p className="text-title font-semibold">Page title 24/600</p>
        <p className="text-section font-semibold">Section heading 20/600</p>
        <p className="text-[18px] font-bold">Slide 3 of 30 · 18/700</p>
        <p className="text-[15px] leading-[1.45] font-medium">Field label 15/500</p>
        <p className="text-body">Body and textarea 15/400</p>
        <p className="text-meta text-fg-muted">Meta 13/400</p>
      </section>
      <DesignShowcase />
    </div>
  );
}
