import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Briefcase, FileUp, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJobs } from '@/hooks/useJobs';
import { createJob } from '@/lib/jobs';
import { extractDocumentText, validateDocumentFile } from '@/lib/resume';

const MIN_JD_CHARS = 100;

/** Jobs you're preparing for, and the form to add one. */
export default function JobDescriptions() {
  const jobs = useJobs();
  const [adding, setAdding] = useState(false);
  const showForm = adding || jobs?.length === 0;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Add a job description and the company’s values to see where your stories and practice fall short.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add a job
          </Button>
        )}
      </div>

      {showForm && <AddJobForm onCancel={jobs?.length ? () => setAdding(false) : undefined} />}

      {jobs === undefined ? (
        <Loader2 className="mx-auto mt-8 size-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="mt-4 space-y-3">
          {jobs.map((j) => (
            <Link key={j.id} to={`/jobs/${j.id}`} className="block" data-testid="job-row">
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-accent/40">
                <Briefcase className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {j.title || 'Untitled role'}
                    {j.company && <span className="text-muted-foreground"> · {j.company}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {format(new Date(j.createdAt), 'd MMM yyyy')}
                    {j.interviewDate && ` · interview ${format(new Date(j.interviewDate), 'd MMM')}`}
                  </p>
                </div>
                {j.gaps ? (
                  <Badge variant="outline" className="font-normal">
                    {j.gaps.storyGaps.filter((g) => g.strength !== 'strong').length} story gaps
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    Not analysed
                  </Badge>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function AddJobForm({ onCancel }: { onCancel?: () => void }) {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [text, setText] = useState('');
  const [values, setValues] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');

  const readFile = async (f: File) => {
    setError('');
    const invalid = validateDocumentFile(f);
    if (invalid) return setError(invalid);
    setReading(true);
    try {
      const extracted = await extractDocumentText(f);
      setText(extracted);
      setFileName(f.name);
      if (extracted.length < MIN_JD_CHARS) setError('We couldn’t read much text from that file. Paste the job description instead.');
    } catch {
      setError('We couldn’t read that file. Paste the job description instead.');
    } finally {
      setReading(false);
    }
  };

  const save = () => {
    const id = createJob({
      company: company.trim(),
      title: title.trim(),
      rawText: text.trim(),
      companyValues: values.trim(),
      fileName,
      interviewDate: interviewDate || null,
    });
    navigate(`/jobs/${id}`);
  };

  return (
    <Card className="space-y-3 p-4" data-testid="add-job">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs font-medium">
          Company
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Monzo" />
        </label>
        <label className="space-y-1 text-xs font-medium">
          Role
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
        </label>
        <label className="space-y-1 text-xs font-medium">
          Interview date (optional)
          <Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
        </label>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">Job description</span>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => fileInput.current?.click()} disabled={reading}>
            {reading ? <Loader2 className="size-3.5 animate-spin" /> : <FileUp className="size-3.5" />}
            {fileName ? `From ${fileName}` : 'Upload PDF, DOCX or TXT'}
          </Button>
        </div>
        <Textarea
          aria-label="Job description"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste the job description…"
        />
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          data-testid="jd-file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void readFile(f);
          }}
        />
      </div>
      <label className="block space-y-1 text-xs font-medium">
        Company values (optional)
        <Textarea
          aria-label="Company values"
          value={values}
          onChange={(e) => setValues(e.target.value)}
          rows={3}
          placeholder="Paste the company’s values or leadership principles, e.g. from their careers page"
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={text.trim().length < MIN_JD_CHARS || reading}>
          Save job
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {text.trim().length < MIN_JD_CHARS && (
          <span className="self-center text-xs text-muted-foreground">Add the job description to continue.</span>
        )}
      </div>
    </Card>
  );
}
