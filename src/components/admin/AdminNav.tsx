import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOpenFeedbackCount, OPEN_FEEDBACK_KEY } from '@/lib/feedback';
import { cn } from '@/lib/utils';

export function useOpenFeedbackCount(enabled = true) {
  return useQuery({
    queryKey: OPEN_FEEDBACK_KEY,
    queryFn: fetchOpenFeedbackCount,
    enabled,
    staleTime: 60_000,
  }).data;
}

/** Sections of the admin panel. */
export function AdminNav() {
  const open = useOpenFeedbackCount();
  const links: [string, string, number | undefined][] = [
    ['/admin', 'Questions', undefined],
    ['/admin/companies', 'Companies', undefined],
    ['/admin/feedback', 'Feedback', open],
    ['/admin/users', 'Users', undefined],
    ['/admin/ai', 'AI usage', undefined],
  ];
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b" aria-label="Admin sections">
      {links.map(([to, label, count]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )
          }
        >
          {label}
          {!!count && (
            <span className="rounded-full bg-destructive px-1.5 text-[10px] leading-4 text-white">{count}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
