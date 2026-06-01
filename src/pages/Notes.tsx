import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Download,
  Archive,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { useAllNotes, useNote } from '@/hooks/useNotes';
import {
  createNote,
  deleteNote,
  noteToMarkdown,
  downloadText,
  exportVaultZip,
} from '@/lib/notes';
import { cn } from '@/lib/utils';

export default function Notes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const notes = useAllNotes();
  const active = useNote(id);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = notes ?? [];
    if (!q) return list;
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, search]);

  // Auto-select first note (or create one) when landing on /notes
  useEffect(() => {
    if (id) return;
    if (notes === undefined) return;
    if (notes.length > 0) {
      navigate(`/notes/${notes[0].id}`, { replace: true });
    }
  }, [id, notes, navigate]);

  const handleNew = async () => {
    const newId = await createNote();
    navigate(`/notes/${newId}`);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    setConfirmDelete(null);
    const rest = (notes ?? []).filter((n) => n.id !== noteId);
    navigate(rest.length ? `/notes/${rest[0].id}` : '/notes', {
      replace: true,
    });
  };

  return (
    <div className="flex h-svh">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r">
        <div className="flex items-center gap-2 border-b p-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Button size="icon" className="size-8 shrink-0" onClick={handleNew}>
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {notes === undefined ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-muted/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {notes.length === 0 ? 'No notes yet.' : 'No matches.'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={handleNew}>
                  <Plus className="size-3.5" /> New note
                </Button>
              </div>
            </div>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/notes/${n.id}`)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm',
                  n.id === id
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/60',
                )}
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  {n.title || 'Untitled note'}
                </span>
                {n.linkedQuestionIds.length > 0 && (
                  <Link2 className="size-3 shrink-0 text-muted-foreground" />
                )}
                <Trash2
                  className="size-3.5 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(n.id);
                  }}
                />
              </button>
            ))
          )}
        </div>

        <div className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Download className="size-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                disabled={!active}
                onClick={() =>
                  active &&
                  downloadText(
                    `${active.title || 'note'}.md`,
                    noteToMarkdown(active),
                  )
                }
              >
                <FileText className="size-4" /> This note (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportVaultZip()}>
                <Archive className="size-4" /> Whole vault (.zip)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Editor */}
      <div className="min-w-0 flex-1">
        {active ? (
          <NoteEditor key={active.id} note={active} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <FileText className="size-8 opacity-40" />
            <p>Select a note or create a new one.</p>
            <Button onClick={handleNew}>
              <Plus className="size-4" /> New note
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>
              This permanently deletes the note. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
