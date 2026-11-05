import { useProfile } from '@/hooks/useProfile';
import NotFound from '@/pages/NotFound';

/** Admin pages look like any missing page to everyone else. */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const profile = useProfile().data;
  if (!profile) return null;
  return profile.isAdmin ? <>{children}</> : <NotFound />;
}
