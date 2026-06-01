import { useCallback, useEffect, useRef, useState } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved';

/**
 * Local-edit field with debounced autosave + manual flush (e.g. on blur).
 * Resets when `initial` changes identity (navigating to another record).
 */
export function useAutosave(
  initial: string,
  save: (value: string) => Promise<void> | void,
  delay = 5000,
) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const latest = useRef(value);
  latest.current = value;

  // Resync when the underlying record changes (and there are no pending edits).
  useEffect(() => {
    if (!dirty.current) setValue(initial);
  }, [initial]);

  const flush = useCallback(async () => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    setStatus('saving');
    await save(latest.current);
    setStatus('saved');
  }, [save]);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      dirty.current = true;
      setStatus('idle');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, delay);
    },
    [delay, flush],
  );

  // Flush pending edits on unmount.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void save(latest.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { value, onChange, flush, status };
}
