import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HandOffPanel } from '@/components/ai/HandOffPanel';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiError, aiPost } from '@/lib/storyAi/client';
import { handOffPrompt, plausibleFix, resumeReadPrompts } from '@/lib/storyAi/prompts';
import { resumeReadSchema, type ResumeReadResult } from '@/lib/storyAi/schemas';

// Above this the request would exceed Vercel's body limit once base64-encoded.
const MAX_PDF_BYTES = 3 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface Props {
  file: File;
  text: string;
  onFixed: (text: string) => void;
}

/**
 * Has Claude read the original PDF to fill in characters the reader couldn't
 * (shown as �): automatically, or by attaching the PDF in claude.ai.
 */
export function FixWithClaude({ file, text, onFixed }: Props) {
  const { status } = useAiStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [manual, setManual] = useState(false);

  const automatic =
    !!status?.enabled && status.remaining.read > 0 && file.size <= MAX_PDF_BYTES && !error?.handOff;

  const fix = async () => {
    setBusy(true);
    setError(null);
    try {
      const { text: fixed } = await aiPost<ResumeReadResult>('resume-read', {
        pdf: await toBase64(file),
        text,
      });
      onFixed(fixed);
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError('server_error', 'Something went wrong. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (!automatic || manual) {
    return (
      <div className="mt-2 rounded-md border bg-background p-3">
        <HandOffPanel<ResumeReadResult>
          reason={
            error?.message ??
            'Open Claude, attach your resume PDF, and paste this prompt. Claude reads the PDF and returns the corrected text.'
          }
          prompt={handOffPrompt(resumeReadPrompts(text, true), resumeReadSchema)}
          schema={resumeReadSchema}
          importLabel="Use corrected text"
          onImport={(value) => {
            if (!plausibleFix(text, value.text)) {
              throw new Error('That reply changed more than the unreadable characters, so it wasn’t used.');
            }
            onFixed(value.text);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={fix} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Fix with Claude
      </Button>
      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setManual(true)}>
        Do it in Claude instead
      </Button>
      {status?.fixture && <span className="text-muted-foreground">Test mode: sample fix, no AI call.</span>}
      {error && <span className="text-destructive">{error.message}</span>}
    </div>
  );
}
