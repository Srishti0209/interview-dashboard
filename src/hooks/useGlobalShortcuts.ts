import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNote } from '@/lib/notes';

/**
 * App-wide shortcuts:
 *  - Cmd/Ctrl+N           → new question
 *  - Cmd/Ctrl+Shift+N     → new note
 * (Cmd/Ctrl+K is handled by the command palette.)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== 'n') return;
      e.preventDefault();
      if (e.shiftKey) {
        const id = await createNote();
        navigate(`/notes/${id}`);
      } else {
        navigate('/my-questions/new');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);
}
