'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from './ui/form';

interface Filter {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
}

export function FilterBar({ filters, search }: { filters: Filter[]; search?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function update(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {search && (
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            update('q', q.trim());
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <Input className="w-56 pl-8" placeholder="Search titles" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search titles" />
        </form>
      )}
      {filters.map((filter) => (
        <Select
          key={filter.name}
          className="w-auto min-w-36"
          aria-label={filter.label}
          value={params.get(filter.name) ?? ''}
          onChange={(e) => update(filter.name, e.target.value)}
        >
          <option value="">{filter.allLabel ?? `All ${filter.label.toLowerCase()}s`}</option>
          {filter.options
            .filter((o) => !(filter.allLabel && o.label === filter.allLabel))
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </Select>
      ))}
    </div>
  );
}
