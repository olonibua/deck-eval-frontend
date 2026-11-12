import { DesignShowcase } from './showcase';

const TOKENS = [
  ['--cream', 'Cream · page'],
  ['--paper', 'Paper · cards'],
  ['--paper-sunk', 'Paper sunk · wells'],
  ['--line', 'Line'],
  ['--line-strong', 'Line strong'],
  ['--ink', 'Ink · cocoa text'],
  ['--ink-soft', 'Ink soft'],
  ['--ink-faint', 'Ink faint'],
  ['--blue', 'Blue'],
  ['--sky', 'Sky'],
  ['--teal', 'Teal'],
  ['--pink', 'Pink'],
  ['--magenta-deep', 'Magenta'],
  ['--lime', 'Lime'],
  ['--yellow', 'Yellow'],
  ['--orange', 'Orange'],
  ['--success', 'Success'],
  ['--danger', 'Danger'],
  ['--resp-a', 'Response A'],
  ['--resp-b', 'Response B'],
];

export default function DesignPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="stamp mb-2">Posy</p>
        <h1 className="text-title font-medium">Design system</h1>
      </div>
      <section>
        <h2 className="mb-3 text-section font-medium">Colour tokens</h2>
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
        <h2 className="mb-3 text-section font-medium">Type scale</h2>
        <p className="text-display font-medium">Display 48/500</p>
        <p className="text-title font-medium">Page title 36/500</p>
        <p className="text-section font-medium">Section heading 22/500</p>
        <p className="text-[18px] font-semibold">Slide 3 of 30 · 18/600</p>
        <p className="text-[15px] leading-[1.45] font-medium">Field label 15/500</p>
        <p className="text-body">Body and textarea 15/400</p>
        <p className="text-meta text-fg-muted">Meta 13/400</p>
        <p className="stamp">Stamp 11/600 uppercase</p>
      </section>
      <DesignShowcase />
    </div>
  );
}
