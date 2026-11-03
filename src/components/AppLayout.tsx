import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  BookOpen,
  Building2,
  Timer,
  Settings,
  GraduationCap,
  Search,
  Sun,
  Moon,
  Monitor,
  LogOut,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, type Theme } from '@/store/ui';
import { useSession, signOut } from '@/hooks/useSession';
import { useProfile } from '@/hooks/useProfile';
import { roleTitle } from '@/lib/constants';

const THEME_ORDER: Theme[] = ['light', 'dark', 'system'];
const THEME_ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/questions', label: 'Question Bank', icon: ListChecks },
  { to: '/notes', label: 'Notepad', icon: NotebookPen },
  { to: '/stories', label: 'Story Bank', icon: BookOpen },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/mock', label: 'Mock Interview', icon: Timer },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  const ThemeIcon = THEME_ICON[theme];
  const email = useSession()?.user.email;
  const profile = useProfile().data;
  const target =
    profile?.targetRoleFamily && profile.targetLevel
      ? roleTitle(profile.targetRoleFamily, profile.targetLevel)
      : null;
  const cycleTheme = () =>
    setTheme(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % 3]);

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="text-sm font-semibold tracking-tight">
            Interview Prep
          </span>
        </div>

        <button
          onClick={() => setCommandOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border bg-muted px-1.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={cycleTheme}
          className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60"
          title="Toggle theme"
        >
          <ThemeIcon className="size-4" />
          <span className="capitalize">{theme}</span>
        </button>

        <div className="mt-2 flex items-center gap-2 border-t pt-3">
          <NavLink
            to="/account"
            className="min-w-0 flex-1 rounded-md px-3 py-1 transition-colors hover:bg-sidebar-accent/60"
            title="Account"
          >
            <span className="block truncate text-xs font-medium">{email}</span>
            {target && (
              <span className="block truncate text-[11px] text-muted-foreground">
                Preparing for {target}
              </span>
            )}
          </NavLink>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <GraduationCap className="size-5 text-primary" />
          <span className="flex-1 text-sm font-semibold">Interview Prep</span>
          <NavLink
            to="/account"
            className="rounded-md p-1.5 text-muted-foreground"
            title="Account"
            aria-label="Account"
          >
            <UserRound className="size-4" />
          </NavLink>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-muted-foreground"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
        <nav className="grid grid-cols-5 border-t bg-sidebar md:hidden">
          {NAV.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
