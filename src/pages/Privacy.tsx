import { GraduationCap } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const CONTACT = 'srishtichaudhary1992@gmail.com';

/** Public privacy policy (/privacy), shown without signing in. */
export default function Privacy() {
  useTheme();
  return (
    <div className="min-h-svh bg-background p-6">
      <article className="mx-auto max-w-2xl space-y-5 text-sm leading-relaxed">
        <a href="/" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-semibold tracking-tight">Interview Prep</span>
        </a>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Privacy policy</h1>
          <p className="text-muted-foreground">Last updated 5 November 2026</p>
        </div>

        <p>
          Interview Prep stores your email address and name to give you an
          account. Everything you add (answers, notes, stories, resume and job
          descriptions) is saved privately in your account, and only you can
          see it.
        </p>

        <p>
          When you use an AI feature, the relevant text (for example your
          resume or a story) is sent to Anthropic's Claude to generate the
          result. It isn't used for anything else.
        </p>

        <p>We don't sell your data or show ads.</p>

        <p>
          To have your account and data deleted, email{' '}
          <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">
            {CONTACT}
          </a>
          .
        </p>
      </article>
    </div>
  );
}
