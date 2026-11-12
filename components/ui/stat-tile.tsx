import Link from 'next/link';
import { cn } from '@/lib/cn';

type Fill = 'yellow' | 'lime' | 'pink' | 'sky';

const FILL: Record<Fill, string> = { yellow: 'bg-yellow', lime: 'bg-lime', pink: 'bg-pink', sky: 'bg-sky' };
const DOTS: Record<Fill, [string, string]> = {
  yellow: ['bg-orange', 'bg-teal'],
  lime: ['bg-orange', 'bg-sky'],
  pink: ['bg-orange', 'bg-blue'],
  sky: ['bg-lime', 'bg-pink'],
};

export function StatTile({ label, value, note, fill, href }: { label: string; value: string | number; note?: string; fill: Fill; href?: string }) {
  const body = (
    <div className={cn('relative h-full overflow-hidden rounded-lg p-[18px] text-cocoa transition-transform', FILL[fill], href && 'hover:-translate-y-0.5')}>
      <span className="absolute top-4 right-4 flex" aria-hidden>
        <span className={cn('h-3.5 w-3.5 rounded-full opacity-85 mix-blend-multiply', DOTS[fill][0])} />
        <span className={cn('-ml-1.5 mt-1.5 h-3.5 w-3.5 rounded-full opacity-85 mix-blend-multiply', DOTS[fill][1])} />
      </span>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-[44px] leading-none font-medium tracking-[-1.5px] tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[12px] opacity-70">{note}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-lg">
      {body}
    </Link>
  ) : (
    body
  );
}
