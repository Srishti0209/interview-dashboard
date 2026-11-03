import { useState } from 'react';
import { GraduationCap, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Passwordless sign-in: Supabase emails a magic link that redirects back to
 * the app, where `detectSessionInUrl` completes the sign-in.
 * Other providers (e.g. Google via `signInWithOAuth`) slot in below the form.
 */
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <GraduationCap className="size-8 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">
            Interview Prep
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to save your answers, notes and stories across devices.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
            <MailCheck className="size-6 text-primary" />
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-xs text-muted-foreground">
              We sent a sign-in link to <strong>{email.trim()}</strong>. Open
              it on this device to continue.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setStatus('idle')}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'sending'}
            >
              {status === 'sending' && <Loader2 className="animate-spin" />}
              Email me a sign-in link
            </Button>
            {status === 'error' && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
