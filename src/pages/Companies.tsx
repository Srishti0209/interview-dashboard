import { Link } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCompanies } from '@/hooks/useCompanies';
import {
  ARCHETYPE_LABEL,
  AI_POLICY_LABEL,
  AI_POLICY_COLOR,
  APPLICATION_STATUS_LABEL,
  APPLICATION_STATUS_COLOR,
} from '@/lib/constants';

export default function Companies() {
  const companies = useCompanies();

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Per-company loop playbooks and application tracking.
        </p>
      </div>

      {companies === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <Link key={c.id} to={`/companies/${c.id}`}>
                <Card className="h-full p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <h3 className="font-semibold">{c.name}</h3>
                    </div>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {c.location} ·{' '}
                    {ARCHETYPE_LABEL[c.archetype]}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        AI_POLICY_COLOR[c.aiPolicy],
                      )}
                    >
                      {AI_POLICY_LABEL[c.aiPolicy]}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        APPLICATION_STATUS_COLOR[
                          c.applicationStatus ?? 'not_applied'
                        ],
                      )}
                    >
                      {
                        APPLICATION_STATUS_LABEL[
                          c.applicationStatus ?? 'not_applied'
                        ]
                      }
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
