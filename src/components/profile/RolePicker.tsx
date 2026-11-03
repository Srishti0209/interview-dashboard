import { Check } from 'lucide-react';
import {
  ROLE_FAMILIES,
  ROLE_FAMILY_BLURB,
  ROLE_FAMILY_LABEL,
  ROLE_LEVELS,
  roleTitle,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { RoleFamily, RoleLevel } from '@/types';

export function RoleFamilyPicker({
  value,
  onChange,
}: {
  value: RoleFamily | null;
  onChange: (family: RoleFamily) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
      {ROLE_FAMILIES.map((family) => {
        const selected = value === family;
        return (
          <button
            key={family}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(family)}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              selected ? 'border-primary bg-accent' : 'hover:bg-accent/50',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                {ROLE_FAMILY_LABEL[family]}
              </div>
              <div className="text-xs text-muted-foreground">
                {ROLE_FAMILY_BLURB[family]}
              </div>
            </div>
            {selected && <Check className="size-4 shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export function RoleLevelPicker({
  family,
  value,
  onChange,
}: {
  family: RoleFamily;
  value: RoleLevel | null;
  onChange: (level: RoleLevel) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {ROLE_LEVELS[family].map((level) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(level)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition-colors',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-accent/50',
            )}
          >
            {roleTitle(family, level)}
          </button>
        );
      })}
    </div>
  );
}

/** Keeps the level valid when the family changes (PO has no Staff level). */
export function coerceLevel(
  family: RoleFamily,
  level: RoleLevel | null,
): RoleLevel | null {
  return level && ROLE_LEVELS[family].includes(level) ? level : null;
}
