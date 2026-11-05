import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { GenerateFromResume } from '@/components/resume/GenerateFromResume';
import { useActiveResume } from '@/hooks/useResume';
import { useProfile } from '@/hooks/useProfile';
import type { Resume } from '@/types';

/**
 * Story Bank's "start from your resume" flow: upload a resume if there isn't
 * one (or `newUpload` is set), then generate draft stories from it.
 */
export function FromResume({ newUpload, onCancel }: { newUpload?: boolean; onCancel?: () => void }) {
  const profile = useProfile().data;
  const active = useActiveResume();
  const [uploaded, setUploaded] = useState<Resume | null>(null);

  if (uploaded) return <GenerateFromResume resume={uploaded} onStoryBank />;
  if (!newUpload && profile?.activeResumeId) {
    if (!active.data) {
      return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
    }
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Using your resume{active.data.fileName ? ` (${active.data.fileName})` : ''}.
        </p>
        <GenerateFromResume resume={active.data} onStoryBank />
      </div>
    );
  }
  return <ResumeUpload onSaved={setUploaded} onCancel={onCancel} />;
}
