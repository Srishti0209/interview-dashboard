import { useState } from 'react';
import { Check, ClipboardCopy, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { claudeUrl } from '@/lib/ai';
import { validateReply } from '@/lib/storyAi/validate';
import type { Schema } from '@/lib/storyAi/schemas';

interface Props<T> {
  /** The full prompt the user runs in Claude. */
  prompt: string;
  schema: Schema;
  /** Saves the validated reply; may throw to show an error. */
  onImport: (value: T) => Promise<void> | void;
  /** Why the automatic path isn't being used (shown above the steps). */
  reason?: string;
  importLabel?: string;
}

/**
 * The "Do it in Claude" path: copy a prompt, run it in claude.ai (on the
 * user's own subscription), then paste the JSON reply back to import it.
 */
export function HandOffPanel<T>({ prompt, schema, onImport, reason, importLabel }: Props<T>) {
  const [copied, setCopied] = useState(false);
  const [reply, setReply] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrors(['Couldn’t copy automatically. Select the prompt below and copy it by hand.']);
    }
  };

  const handleImport = async () => {
    const result = validateReply<T>(schema, reply);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onImport(result.value);
      setReply('');
    } catch (e) {
      setErrors([e instanceof Error ? e.message : 'Could not import that reply.']);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="handoff-panel">
      {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      <ol className="space-y-3 text-sm">
        <li>
          <p className="mb-1.5 font-medium">1. Copy the prompt and run it in Claude</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copy}>
              {copied ? <Check /> : <ClipboardCopy />}
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a
                href={claudeUrl('I’ll paste a prompt from my interview prep app next.')}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink /> Open Claude
              </a>
            </Button>
          </div>
          <details className="mt-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer">Show prompt</summary>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-2">
              {prompt}
            </pre>
          </details>
        </li>
        <li>
          <p className="mb-1.5 font-medium">2. Paste Claude’s reply here</p>
          <Textarea
            aria-label="Claude’s reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={6}
            className="font-mono text-xs"
            placeholder="Paste the whole reply, including the JSON block…"
          />
        </li>
      </ol>
      <Button size="sm" onClick={handleImport} disabled={!reply.trim() || saving}>
        {saving && <Loader2 className="animate-spin" />}
        {importLabel ?? 'Import'}
      </Button>
      {errors.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
