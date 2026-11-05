import { useRef, useState } from 'react';
import { FileUp, Loader2, AlertTriangle, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSaveResume } from '@/hooks/useResume';
import {
  RESUME_MIN_CHARS,
  extractResumeText,
  validateResumeFile,
} from '@/lib/resume';
import { UNREADABLE } from '@/lib/pdfLayout';
import { FixWithClaude } from '@/components/resume/FixWithClaude';
import { cn } from '@/lib/utils';
import type { Resume } from '@/types';

type Step = 'choose' | 'extracting' | 'review';

interface Props {
  onSaved?: (resume: Resume) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

/**
 * Upload a resume (PDF/DOCX/TXT) or paste its text. Extracted text is always
 * shown for review before saving, and a file that yields too little text
 * (e.g. a scanned PDF) switches to the paste fallback.
 */
export function ResumeUpload({ onSaved, onCancel, cancelLabel }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('choose');
  const [file, setFile] = useState<File | undefined>();
  const [text, setText] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const save = useSaveResume();

  const handleFile = async (f: File) => {
    setError('');
    setNotice('');
    const invalid = validateResumeFile(f);
    if (invalid) {
      setError(invalid);
      return;
    }
    setStep('extracting');
    try {
      const extracted = await extractResumeText(f);
      setFile(f);
      setText(extracted);
      if (extracted.length < RESUME_MIN_CHARS) {
        setNotice(
          "We couldn't read much text from that file. It may be a scanned or image-only PDF. Paste your resume text below instead.",
        );
      }
      setStep('review');
    } catch {
      setFile(undefined);
      setText('');
      setNotice(
        "We couldn't read that file. Paste your resume text below instead.",
      );
      setStep('review');
    }
  };

  const startPaste = () => {
    setFile(undefined);
    setText('');
    setNotice('');
    setError('');
    setStep('review');
  };

  const reset = () => {
    setStep('choose');
    setFile(undefined);
    setText('');
    setNotice('');
    setError('');
  };

  const handleSave = () => {
    setError('');
    save.mutate(
      { text: text.trim(), file },
      {
        onSuccess: (resume) => onSaved?.(resume),
        onError: (e) =>
          setError(e instanceof Error ? e.message : 'Could not save resume.'),
      },
    );
  };

  const tooShort = text.trim().length < RESUME_MIN_CHARS;
  const unreadable = text.split(UNREADABLE).length - 1;

  if (step === 'extracting') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Reading your resume…
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-3">
        {notice && (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <span>{notice}</span>
          </div>
        )}
        <div>
          <p className="text-sm font-medium">
            {file && !notice ? 'Does this look right?' : 'Paste your resume'}
          </p>
          <p className="text-xs text-muted-foreground">
            {file && !notice
              ? `Text read from ${file.name}. Fix anything that came through garbled before saving.`
              : 'Copy the text from your resume and paste it here.'}
          </p>
        </div>
        {unreadable > 0 && (
          <div
            className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
            data-testid="unreadable-warning"
          >
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p>
                {unreadable === 1 ? '1 character' : `${unreadable} characters`} in this PDF
                couldn’t be read and {unreadable === 1 ? 'shows' : 'show'} as {UNREADABLE}. These
                are often symbols like “+” or “-” (e.g. “7{UNREADABLE} years” is probably “7+
                years”). Let Claude read the PDF to fix them, or fix them below by hand.
              </p>
              {file && (
                <FixWithClaude file={file} text={text} onFixed={setText} />
              )}
            </div>
          </div>
        )}
        <Textarea
          aria-label="Resume text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="font-mono text-xs"
          placeholder="Paste your resume text…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={tooShort || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            Save resume
          </Button>
          <Button variant="ghost" onClick={reset} disabled={save.isPending}>
            Back
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {tooShort
              ? `${text.trim().length}/${RESUME_MIN_CHARS} characters minimum`
              : `${text.trim().length} characters`}
          </span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) void handleFile(f);
        }}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors',
          dragging ? 'border-primary bg-accent' : 'hover:bg-accent/50',
        )}
      >
        <FileUp className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium">
          Drop your resume here, or click to choose
        </span>
        <span className="text-xs text-muted-foreground">
          PDF, DOCX or TXT, up to 5 MB
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="hidden"
        data-testid="resume-file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void handleFile(f);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={startPaste}>
          <ClipboardPaste />
          Paste resume text instead
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onCancel}
          >
            {cancelLabel ?? 'Cancel'}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
