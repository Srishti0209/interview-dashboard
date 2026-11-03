import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RoleFamilyPicker,
  RoleLevelPicker,
  coerceLevel,
} from '@/components/profile/RolePicker';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { useUpdateProfile } from '@/hooks/useProfile';
import { CURRENT_ROLE_SUGGESTIONS, roleTitle } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Profile, RoleFamily, RoleLevel } from '@/types';

const STEPS = ['Current role', 'Target role', 'Level', 'Resume'] as const;

/** First-run setup: current role → target role → level → optional resume. */
export default function Onboarding({ profile }: { profile: Profile }) {
  const [step, setStep] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(
    profile.currentPosition ?? '',
  );
  const [family, setFamily] = useState<RoleFamily | null>(
    profile.targetRoleFamily,
  );
  const [level, setLevel] = useState<RoleLevel | null>(profile.targetLevel);
  const update = useUpdateProfile();

  const finish = () =>
    update.mutate({
      currentPosition: currentPosition.trim(),
      targetRoleFamily: family,
      targetLevel: level,
      onboarded: true,
    });

  const canNext =
    (step === 0 && currentPosition.trim().length > 0) ||
    (step === 1 && family !== null) ||
    (step === 2 && level !== null);

  return (
    <div className="flex min-h-svh items-start justify-center p-6 sm:items-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="text-sm font-semibold tracking-tight">
            Interview Prep
          </span>
        </div>

        <ol className="flex gap-2" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full',
                  i <= step ? 'bg-primary' : 'bg-muted',
                )}
              />
              <span
                className={cn(
                  'mt-1 block text-[11px]',
                  i === step ? 'font-medium' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                What is your current role?
              </h1>
              <p className="text-sm text-muted-foreground">
                This helps tailor questions and stories to your experience.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current-role">Current role</Label>
              <Input
                id="current-role"
                autoFocus
                placeholder="e.g. Senior Software Engineer"
                value={currentPosition}
                onChange={(e) => setCurrentPosition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canNext) setStep(1);
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CURRENT_ROLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCurrentPosition(s)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    currentPosition === s
                      ? 'border-primary bg-accent'
                      : 'text-muted-foreground hover:bg-accent/50',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Which role are you preparing for?
              </h1>
              <p className="text-sm text-muted-foreground">
                Your question bank and company playbooks follow this choice.
                You can change it any time in your account.
              </p>
            </div>
            <RoleFamilyPicker
              value={family}
              onChange={(f) => {
                setFamily(f);
                setLevel((l) => coerceLevel(f, l));
              }}
            />
          </section>
        )}

        {step === 2 && family && (
          <section className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                At what level?
              </h1>
              <p className="text-sm text-muted-foreground">
                Senior and Staff levels add more depth on system design and
                leadership.
              </p>
            </div>
            <RoleLevelPicker family={family} value={level} onChange={setLevel} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Add your resume (optional)
              </h1>
              <p className="text-sm text-muted-foreground">
                We'll use it to build your story bank and behavioural questions
                tailored to your experience. You can skip this and add it later
                from your account or the Story Bank.
              </p>
            </div>
            <ResumeUpload
              onSaved={finish}
              onCancel={finish}
              cancelLabel="Skip for now"
            />
          </section>
        )}

        {update.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Setting up your prep for{' '}
            {family && level ? roleTitle(family, level) : 'you'}…
          </div>
        )}
        {update.isError && (
          <p className="text-xs text-destructive">
            Couldn't save your profile: {update.error.message}
          </p>
        )}

        {step < 3 && (
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              className="ml-auto"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
            >
              Continue
            </Button>
          </div>
        )}
        {step === 3 && !update.isPending && (
          <Button variant="ghost" onClick={() => setStep(2)}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
