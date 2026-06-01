import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  BookOpen,
  Building2,
  Timer,
  Settings,
  Plus,
  FilePlus2,
  Search,
} from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { useAllQuestions } from '@/hooks/useQuestions';
import { useAllNotes } from '@/hooks/useNotes';
import { createNote } from '@/lib/notes';

export function CommandPalette() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const navigate = useNavigate();
  const questions = useAllQuestions();
  const notes = useAllNotes();

  // Cmd/Ctrl+K toggles
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUIStore.getState().commandOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const newNote = async () => {
    setOpen(false);
    const id = await createNote();
    navigate(`/notes/${id}`);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder="Search or jump to…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Item onSelect={() => go('/my-questions/new')} icon={Plus}>
              New question
            </Item>
            <Item onSelect={newNote} icon={FilePlus2}>
              New note
            </Item>
          </Command.Group>

          <Command.Group
            heading="Go to"
            className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Item onSelect={() => go('/')} icon={LayoutDashboard}>
              Dashboard
            </Item>
            <Item onSelect={() => go('/questions')} icon={ListChecks}>
              Question Bank
            </Item>
            <Item onSelect={() => go('/notes')} icon={NotebookPen}>
              Notepad
            </Item>
            <Item onSelect={() => go('/stories')} icon={BookOpen}>
              Story Bank
            </Item>
            <Item onSelect={() => go('/companies')} icon={Building2}>
              Companies
            </Item>
            <Item onSelect={() => go('/mock')} icon={Timer}>
              Mock Interview
            </Item>
            <Item onSelect={() => go('/settings')} icon={Settings}>
              Settings
            </Item>
          </Command.Group>

          {questions && questions.length > 0 && (
            <Command.Group
              heading="Questions"
              className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {questions.slice(0, 200).map((q) => (
                <Item
                  key={q.id}
                  value={`q ${q.title}`}
                  onSelect={() => go(`/questions/${q.id}`)}
                  icon={ListChecks}
                >
                  {q.title}
                </Item>
              ))}
            </Command.Group>
          )}

          {notes && notes.length > 0 && (
            <Command.Group
              heading="Notes"
              className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {notes.map((n) => (
                <Item
                  key={n.id}
                  value={`note ${n.title}`}
                  onSelect={() => go(`/notes/${n.id}`)}
                  icon={NotebookPen}
                >
                  {n.title || 'Untitled note'}
                </Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function Item({
  children,
  onSelect,
  icon: Icon,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon: typeof Plus;
  value?: string;
}) {
  return (
    <Command.Item
      value={value ?? String(children)}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      <Icon className="size-4 text-muted-foreground" />
      <span className="truncate">{children}</span>
    </Command.Item>
  );
}
