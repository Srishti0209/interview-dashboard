import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

/**
 * New password + confirmation. Used on the Account page and on the
 * "Create a password" step for new users. `onDone` runs after it's saved.
 */
export function PasswordForm({
  submitLabel = 'Set password',
  onDone,
}: {
  submitLabel?: string;
  onDone?: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = password.length >= 8 && confirm === password;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    // password_set lets onboarding skip the "Create a password" step.
    const { error } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setPassword('');
    setConfirm('');
    if (onDone) return onDone();
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {tooShort && (
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && (
          <p className="text-xs text-destructive">Passwords don't match.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!valid || busy}>
          {busy && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5" />
            Password set. You can now sign in with it.
          </span>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </form>
  );
}
