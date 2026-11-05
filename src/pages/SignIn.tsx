import { useEffect, useState } from 'react';
import { GraduationCap, Loader2, MailCheck } from 'lucide-react';
import { googleSignInEnabled, supabase } from '@/lib/supabase';
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
 * "Continue with Google" appears once Google is enabled in Supabase.
 */
export default function SignIn() {
  const [mode, setMode] = useState<Mode>('link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    void googleSignInEnabled().then(setGoogle);
  }, []);

  const signInWithGoogle = async () => {
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // On success the browser is already leaving for Google.
    if (error) fail(error.message);
  };

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
          <div className="space-y-4">
            {google && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={status === 'sending'}
                  onClick={() => void signInWithGoogle()}
                >
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  or
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
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
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <a href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy policy
          </a>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.6H1.28a12 12 0 0 0 0 10.8l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.6l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z"
      />
    </svg>
  );
}
