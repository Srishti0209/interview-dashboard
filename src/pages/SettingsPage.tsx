import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { useUIStore, type Theme } from '@/store/ui';
import {
  exportAll,
  downloadBackup,
  importAll,
  resetToSeed,
  type BackupFile,
} from '@/lib/backup';
import { cn } from '@/lib/utils';

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function SettingsPage() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const fontSize = useUIStore((s) => s.notepadFontSize);
  const setFontSize = useUIStore((s) => s.setNotepadFontSize);
  const hardFactor = useUIStore((s) => s.srsHardFactor);
  const easyBonus = useUIStore((s) => s.srsEasyBonus);
  const setSrsConfig = useUIStore((s) => s.setSrsConfig);

  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState<string>('');
  const [toast, setToast] = useState('');

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleExport = async () => {
    setBusy('export');
    try {
      downloadBackup(await exportAll());
      flash('Exported backup JSON.');
    } finally {
      setBusy('');
    }
  };

  const handleImport = async (file: File) => {
    setBusy('import');
    try {
      const data = JSON.parse(await file.text()) as BackupFile;
      await importAll(data);
      flash('Imported. Reloading…');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy('');
    }
  };

  const handleReset = async () => {
    setBusy('reset');
    try {
      await resetToSeed();
      setConfirmReset(false);
      flash('Re-seeded. Your answers, notes & statuses were preserved.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {/* Appearance */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <Label className="mt-3 block">Theme</Label>
        <div className="mt-2 flex gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                theme === value
                  ? 'border-primary bg-accent'
                  : 'hover:bg-accent/50',
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        <Label className="mt-5 block">
          Notepad font size — {fontSize}px
        </Label>
        <input
          type="range"
          min={12}
          max={24}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="mt-2 w-full accent-primary"
        />
      </Card>

      {/* Spaced repetition */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold">Spaced repetition</h2>
        <p className="text-xs text-muted-foreground">
          Tune the interval multipliers. Defaults: Hard ×1.2, Easy bonus ×1.3.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <Label>Hard factor</Label>
            <Input
              type="number"
              step="0.05"
              min="1"
              value={hardFactor}
              onChange={(e) =>
                setSrsConfig({ hardFactor: Number(e.target.value) })
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Easy bonus</Label>
            <Input
              type="number"
              step="0.05"
              min="1"
              value={easyBonus}
              onChange={(e) =>
                setSrsConfig({ easyBonus: Number(e.target.value) })
              }
              className="mt-1.5"
            />
          </div>
        </div>
      </Card>

      {/* Data */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold">Data & backup</h2>
        <p className="text-xs text-muted-foreground">
          Everything is stored locally on this device. Export regularly to back
          up.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={busy === 'export'}
          >
            <Download className="size-4" /> Export all (JSON)
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={busy === 'import'}
          >
            <Upload className="size-4" /> Import
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmReset(true)}
            disabled={busy === 'reset'}
          >
            <RotateCcw className="size-4" /> Reset to seed
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </Card>

      {toast && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm shadow-lg">
          <Check className="size-4 text-emerald-500" /> {toast}
        </div>
      )}

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to seed?</DialogTitle>
            <DialogDescription>
              This refreshes the pre-loaded questions, stories and companies to
              the latest seed content. Your own questions, written answers,
              personal notes, bookmarks, notes, application statuses and mock
              history are <strong>preserved</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button onClick={handleReset} disabled={busy === 'reset'}>
              Reset to seed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
