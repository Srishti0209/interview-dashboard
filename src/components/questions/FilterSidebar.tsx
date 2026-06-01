import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ROUND_TYPES,
  ROUND_LABEL,
  DIFFICULTIES,
} from '@/lib/constants';
import { useUIStore } from '@/store/ui';
import type { RoundType, Difficulty, Source, Confidence } from '@/types';

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {title}
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckRow({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <span className="truncate">{label}</span>
    </label>
  );
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FilterSidebar({
  tags,
  companies,
}: {
  tags: string[];
  companies: string[];
}) {
  const filters = useUIStore((s) => s.filters);
  const setFilters = useUIStore((s) => s.setFilters);
  const resetFilters = useUIStore((s) => s.resetFilters);

  const activeCount =
    filters.roundTypes.length +
    filters.difficulties.length +
    filters.sources.length +
    filters.companies.length +
    filters.tags.length +
    filters.confidences.length +
    (filters.bookmarkedOnly ? 1 : 0);

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between pb-1">
        <span className="text-sm font-semibold">Filters</span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={resetFilters}
          >
            <RotateCcw className="size-3" /> Reset ({activeCount})
          </Button>
        )}
      </div>

      <FilterGroup title="Round type">
        {ROUND_TYPES.map((r: RoundType) => (
          <CheckRow
            key={r}
            checked={filters.roundTypes.includes(r)}
            onToggle={() =>
              setFilters({ roundTypes: toggle(filters.roundTypes, r) })
            }
            label={ROUND_LABEL[r]}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Difficulty">
        {DIFFICULTIES.map((d: Difficulty) => (
          <CheckRow
            key={d}
            checked={filters.difficulties.includes(d)}
            onToggle={() =>
              setFilters({ difficulties: toggle(filters.difficulties, d) })
            }
            label={<span className="capitalize">{d}</span>}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Confidence">
        {([0, 1, 2, 3, 4, 5] as Confidence[]).map((c) => (
          <CheckRow
            key={c}
            checked={filters.confidences.includes(c)}
            onToggle={() =>
              setFilters({ confidences: toggle(filters.confidences, c) })
            }
            label={c === 0 ? 'Unseen (0)' : `Level ${c}`}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Source">
        {(['seed', 'user'] as Source[]).map((s) => (
          <CheckRow
            key={s}
            checked={filters.sources.includes(s)}
            onToggle={() => setFilters({ sources: toggle(filters.sources, s) })}
            label={s === 'seed' ? 'Seeded' : 'My questions'}
          />
        ))}
        <CheckRow
          checked={filters.bookmarkedOnly}
          onToggle={() =>
            setFilters({ bookmarkedOnly: !filters.bookmarkedOnly })
          }
          label="Bookmarked only"
        />
      </FilterGroup>

      {companies.length > 0 && (
        <FilterGroup title="Company" defaultOpen={false}>
          <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {companies.map((c) => (
              <CheckRow
                key={c}
                checked={filters.companies.includes(c)}
                onToggle={() =>
                  setFilters({ companies: toggle(filters.companies, c) })
                }
                label={c}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      {tags.length > 0 && (
        <FilterGroup title="Tags" defaultOpen={false}>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {tags.map((t) => (
              <CheckRow
                key={t}
                checked={filters.tags.includes(t)}
                onToggle={() => setFilters({ tags: toggle(filters.tags, t) })}
                label={t}
              />
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}
