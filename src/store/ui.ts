import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoundType, Difficulty, Source, Confidence } from '@/types';

export type Theme = 'light' | 'dark' | 'system';

export interface QuestionFilters {
  search: string;
  roundTypes: RoundType[];
  companies: string[];
  difficulties: Difficulty[];
  tags: string[];
  sources: Source[];
  confidences: Confidence[];
  bookmarkedOnly: boolean;
}

export const emptyFilters: QuestionFilters = {
  search: '',
  roundTypes: [],
  companies: [],
  difficulties: [],
  tags: [],
  sources: [],
  confidences: [],
  bookmarkedOnly: false,
};

export type QuestionView = 'list' | 'cards' | 'deck';

interface UIState {
  theme: Theme;
  setTheme: (t: Theme) => void;

  targetCompanyId: string | null;
  setTargetCompanyId: (id: string | null) => void;

  filters: QuestionFilters;
  setFilters: (f: Partial<QuestionFilters>) => void;
  resetFilters: () => void;

  questionView: QuestionView;
  setQuestionView: (v: QuestionView) => void;

  hideAnswers: boolean;
  setHideAnswers: (v: boolean) => void;

  notepadFontSize: number;
  setNotepadFontSize: (n: number) => void;

  srsHardFactor: number;
  srsEasyBonus: number;
  setSrsConfig: (c: { hardFactor?: number; easyBonus?: number }) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      targetCompanyId: null,
      setTargetCompanyId: (targetCompanyId) => set({ targetCompanyId }),

      filters: emptyFilters,
      setFilters: (f) =>
        set((s) => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: emptyFilters }),

      questionView: 'list',
      setQuestionView: (questionView) => set({ questionView }),

      hideAnswers: false,
      setHideAnswers: (hideAnswers) => set({ hideAnswers }),

      notepadFontSize: 16,
      setNotepadFontSize: (notepadFontSize) => set({ notepadFontSize }),

      srsHardFactor: 1.2,
      srsEasyBonus: 1.3,
      setSrsConfig: (c) =>
        set((s) => ({
          srsHardFactor: c.hardFactor ?? s.srsHardFactor,
          srsEasyBonus: c.easyBonus ?? s.srsEasyBonus,
        })),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: 'interview-prep-ui',
      partialize: (s) => ({
        theme: s.theme,
        targetCompanyId: s.targetCompanyId,
        questionView: s.questionView,
        notepadFontSize: s.notepadFontSize,
        srsHardFactor: s.srsHardFactor,
        srsEasyBonus: s.srsEasyBonus,
      }),
    },
  ),
);
