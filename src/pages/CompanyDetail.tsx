import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Markdown } from '@/components/Markdown';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { SaveStatus } from '@/components/SaveStatus';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompany } from '@/hooks/useCompanies';
import { useAllQuestions } from '@/hooks/useQuestions';
import { useAutosave } from '@/hooks/useAutosave';
import { setApplicationStatus, updateCompany } from '@/lib/companies';
import {
  ARCHETYPE_LABEL,
  AI_POLICY_LABEL,
  AI_POLICY_COLOR,
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABEL,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const company = useCompany(id);
  const allQuestions = useAllQuestions();

  const research = useAutosave(
    company?.applicationNotes ?? '',
    (v) => (id ? updateCompany(id, { applicationNotes: v }) : undefined),
  );

  const linkedQuestions = useMemo(() => {
    if (!company || !allQuestions) return [];
    return allQuestions.filter((q) =>
      q.company?.some(
        (c) => c.toLowerCase() === company.name.toLowerCase(),
      ),
    );
  }, [company, allQuestions]);

  if (company === undefined) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    );
  }
  if (company === null) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">Company not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/companies">Back to Companies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/companies')}
        className="-ml-2 mb-3 gap-1 text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Companies
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {company.location} ·{' '}
            {ARCHETYPE_LABEL[company.archetype]}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium',
            AI_POLICY_COLOR[company.aiPolicy],
          )}
        >
          {AI_POLICY_LABEL[company.aiPolicy]}
        </span>
      </div>

      {/* Application tracking */}
      <Card className="mt-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Label>Application status</Label>
            <div className="mt-1.5">
              <Select
                value={company.applicationStatus ?? 'not_applied'}
                onValueChange={(v) =>
                  setApplicationStatus(company.id, v as ApplicationStatus)
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {APPLICATION_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {company.applicationDates && company.applicationDates.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </p>
            <ol className="space-y-1.5">
              {company.applicationDates.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="font-medium">
                    {APPLICATION_STATUS_LABEL[d.stage as ApplicationStatus] ??
                      d.stage}
                  </span>
                  <span className="text-muted-foreground">
                    {format(d.date, 'd MMM yyyy, HH:mm')}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>

      {/* Loop structure */}
      {company.loopStructure?.trim() && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Loop structure
          </h2>
          <Card className="p-4">
            <Markdown>{company.loopStructure}</Markdown>
          </Card>
        </section>
      )}

      {/* Seed notes */}
      {company.notes?.trim() && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </h2>
          <Card className="p-4">
            <Markdown>{company.notes}</Markdown>
          </Card>
        </section>
      )}

      {/* Links */}
      {company.links && company.links.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Links
          </h2>
          <div className="flex flex-wrap gap-2">
            {company.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                {l.label} <ExternalLink className="size-3.5" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Research notes */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My research notes
          </h2>
          <SaveStatus status={research.status} />
        </div>
        <MarkdownEditor
          value={research.value}
          onChange={research.onChange}
          onBlur={research.flush}
          placeholder="Recruiter name, comp range, prep plan, people to talk to…"
          minRows={6}
        />
      </section>

      {/* Linked questions */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tagged questions ({linkedQuestions.length})
        </h2>
        {linkedQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No questions tagged with this company yet.
          </p>
        ) : (
          <div className="space-y-2">
            {linkedQuestions.map((q) => (
              <Link
                key={q.id}
                to={`/questions/${q.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{q.title}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <RoundPill round={q.roundType} />
                    <DifficultyBadge difficulty={q.difficulty} />
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
