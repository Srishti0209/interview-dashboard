import { useState } from 'react';
import { format } from 'date-fns';
import { Check, Download, FileText, Loader2, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RoleFamilyPicker,
  RoleLevelPicker,
  coerceLevel,
} from '@/components/profile/RolePicker';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useActiveResume } from '@/hooks/useResume';
import { useSession, signOut } from '@/hooks/useSession';
import { resumeDownloadUrl } from '@/lib/resume';
import { CURRENT_ROLE_SUGGESTIONS, roleTitle } from '@/lib/constants';
import type { Profile, RoleFamily, RoleLevel } from '@/types';

export default function Account() {
  const { data: profile } = useProfile();
  const email = useSession()?.user.email;

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Account</h1>
      <p className="text-sm text-muted-foreground">{email}</p>

      <ProfileForm key={profile.id} profile={profile} />
      <ResumeCard />

      <Card className="mt-4 flex items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Sign out</h2>
          <p className="text-xs text-muted-foreground">
            Your data stays saved in your account.
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut />
          Sign out
        </Button>
      </Card>
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [currentPosition, setCurrentPosition] = useState(
    profile.currentPosition ?? '',
  );
  const [family, setFamily] = useState<RoleFamily | null>(
    profile.targetRoleFamily,
  );
  const [level, setLevel] = useState<RoleLevel | null>(profile.targetLevel);
  const [saved, setSaved] = useState(false);

  const dirty =
    displayName !== (profile.displayName ?? '') ||
    currentPosition !== (profile.currentPosition ?? '') ||
    family !== profile.targetRoleFamily ||
    level !== profile.targetLevel;
  const valid = Boolean(family && level && currentPosition.trim());

  const save = () =>
    update.mutate(
      {
        displayName: displayName.trim() || null,
        currentPosition: currentPosition.trim(),
        targetRoleFamily: family,
        targetLevel: level,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );

  return (
    <>
      <Card className="mt-4 space-y-4 p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="current-role">Current role</Label>
          <Input
            id="current-role"
            list="current-role-suggestions"
            value={currentPosition}
            onChange={(e) => setCurrentPosition(e.target.value)}
          />
          <datalist id="current-role-suggestions">
            {CURRENT_ROLE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </Card>

      <Card className="mt-4 space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold">Role you're preparing for</h2>
          <p className="text-xs text-muted-foreground">
            Changing this updates your question bank and company playbooks.
            Your saved answers, notes and stories are kept.
          </p>
        </div>
        <RoleFamilyPicker
          value={family}
          onChange={(f) => {
            setFamily(f);
            setLevel((l) => coerceLevel(f, l));
          }}
        />
        {family && (
          <div className="space-y-1.5">
            <Label>Level</Label>
            <RoleLevelPicker family={family} value={level} onChange={setLevel} />
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={!dirty || !valid || update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5" />
            Saved
            {family && level ? ` — preparing for ${roleTitle(family, level)}` : ''}
          </span>
        )}
        {update.isError && (
          <span className="text-xs text-destructive">
            {update.error.message}
          </span>
        )}
      </div>
    </>
  );
}

function ResumeCard() {
  const { data: resume, isLoading } = useActiveResume();
  const [replacing, setReplacing] = useState(false);
  const [showText, setShowText] = useState(false);

  const download = async (path: string) => {
    window.open(await resumeDownloadUrl(path), '_blank', 'noopener');
  };

  return (
    <Card className="mt-4 space-y-3 p-5">
      <div>
        <h2 className="text-sm font-semibold">Resume</h2>
        <p className="text-xs text-muted-foreground">
          Used to build your story bank and resume-based behavioural questions.
          Only you can see it.
        </p>
      </div>

      {isLoading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : resume && !replacing ? (
        <>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {resume.fileName ?? 'Pasted resume text'}
              </div>
              <div className="text-xs text-muted-foreground">
                Added {format(new Date(resume.createdAt), 'd MMM yyyy')} ·{' '}
                {resume.extractedText.length} characters
              </div>
            </div>
            {resume.storagePath && (
              <Button
                variant="ghost"
                size="icon"
                title="Download original"
                aria-label="Download original"
                onClick={() => download(resume.storagePath!)}
              >
                <Download />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setReplacing(true)}>
              Replace resume
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowText((s) => !s)}
            >
              {showText ? 'Hide text' : 'View text'}
            </Button>
          </div>
          {showText && (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {resume.extractedText}
            </pre>
          )}
        </>
      ) : (
        <ResumeUpload
          onSaved={() => setReplacing(false)}
          onCancel={replacing ? () => setReplacing(false) : undefined}
        />
      )}
    </Card>
  );
}
