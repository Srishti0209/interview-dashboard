import { useState } from 'react';
import { GraduationCap, Loader2, MailCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Status = 'idle' | 'sending' | 'sent' | 'error';
type Mode = 'link' | 'password';

/**
 * Sign-in by emailed magic link (default) or by password for accounts that
 * have one. The magic link redirects back to the app, where
 * `detectSessionInUrl` completes the sign-in; a successful password sign-in
 * updates the session directly and AuthGate renders the app.
 * Other providers (e.g. Google via `signInWithOAuth`) slot in below the form.
 */
export default function SignIn() {
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const fail = (message: string) => {
    setError(message);
    setStatus('error');
  };

  const sendLink = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (!error) return setStatus('sent');
    fail(
      error.status === 429 || /rate limit/i.test(error.message)
        ? 'Too many sign-in emails were sent recently. Please wait a few minutes and try again, or sign in with a password. If you already received a link, you can still use it.'
        : error.message,
    );
  };

  const signInWithPassword = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (!error) return setStatus('idle');
    fail(
      /invalid login credentials/i.test(error.message)
        ? 'Wrong email or password. If your account has no password yet, use the email link instead.'
        : error.message,
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    void (mode === 'link' ? sendLink() : signInWithPassword());
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStatus('idle');
    setError('');
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
          <form onSubmit={submit} className="space-y-3">
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
            {mode === 'password' && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'sending'}
            >
              {status === 'sending' && <Loader2 className="animate-spin" />}
              {mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}
            </Button>
            {status === 'error' && (
              <p className="text-xs text-destructive">{error}</p>
            )}
            <button
              type="button"
              onClick={() => switchMode(mode === 'link' ? 'password' : 'link')}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {mode === 'link'
                ? 'Sign in with a password instead'
                : 'Email me a sign-in link instead'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
