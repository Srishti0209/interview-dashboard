import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { TokenInput } from '@/components/TokenInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ROUND_TYPES,
  ROUND_LABEL,
  DIFFICULTIES,
} from '@/lib/constants';
import { createQuestion, updateQuestion } from '@/lib/questions';
import { useAllQuestions, useFacets, useQuestion } from '@/hooks/useQuestions';
import type { RoundType, Difficulty } from '@/types';

export default function NewQuestion() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit') ?? undefined;
  const editing = useQuestion(editId);

  const allQuestions = useAllQuestions();
  const { tags: tagSuggestions, companies: companySuggestions } =
    useFacets(allQuestions);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [answer, setAnswer] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('JS_FUNDAMENTALS');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [company, setCompany] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // Prefill in edit mode
  useEffect(() => {
    if (editing && editId) {
      setTitle(editing.title);
      setBody(editing.body);
      setAnswer(editing.answer ?? '');
      setRoundType(editing.roundType);
      setDifficulty(editing.difficulty);
      setCompany(editing.company ?? []);
      setTags(editing.tags ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  const isEditMode = !!editId;
  const valid = title.trim().length > 0 && body.trim().length > 0;

  async function handleSave() {
    setTouched(true);
    if (!valid) return;
    setSaving(true);
    try {
      if (isEditMode && editId) {
        await updateQuestion(editId, {
          title: title.trim(),
          body,
          answer: answer.trim() ? answer : undefined,
          roundType,
          difficulty,
          company,
          tags,
        });
        navigate(`/questions/${editId}`);
      } else {
        const id = await createQuestion({
          title,
          body,
          answer,
          roundType,
          difficulty,
          company,
          tags,
        });
        navigate(`/questions/${id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (isEditMode && editing === null) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">Question not found.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/questions">Back to Question Bank</Link>
        </Button>
      </div>
    );
  }

  if (isEditMode && editing && editing.source !== 'user') {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted-foreground">
          Seeded questions can't be edited. Use the My Answer and Notes tabs to
          make it yours.
        </p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to={`/questions/${editId}`}>Back to question</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="-ml-2 mb-3 gap-1 text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <h1 className="text-xl font-semibold tracking-tight">
        {isEditMode ? 'Edit question' : 'Add your own question'}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isEditMode
          ? 'Update the details of your question.'
          : 'Capture a question you just got asked. Tip: press ⌘S to save.'}
      </p>

      <div className="space-y-5">
        <div>
          <Label htmlFor="q-title">Title *</Label>
          <Input
            id="q-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement a debounce function"
            className="mt-1.5"
            autoFocus
          />
          {touched && !title.trim() && (
            <p className="mt-1 text-xs text-destructive">Title is required.</p>
          )}
        </div>

        <div>
          <Label>Question body *</Label>
          <div className="mt-1.5">
            <MarkdownEditor
              value={body}
              onChange={setBody}
              placeholder="Describe the question (markdown supported)…"
            />
          </div>
          {touched && !body.trim() && (
            <p className="mt-1 text-xs text-destructive">Body is required.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Round type</Label>
            <Select
              value={roundType}
              onValueChange={(v) => setRoundType(v as RoundType)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROUND_TYPES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROUND_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="mt-1.5 capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d} className="capitalize">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Companies</Label>
          <div className="mt-1.5">
            <TokenInput
              value={company}
              onChange={setCompany}
              suggestions={companySuggestions}
              placeholder="Add a company and press Enter…"
            />
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="mt-1.5">
            <TokenInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              placeholder="Add a tag and press Enter…"
            />
          </div>
        </div>

        <div>
          <Label>Model answer (optional)</Label>
          <div className="mt-1.5">
            <MarkdownEditor
              value={answer}
              onChange={setAnswer}
              placeholder="Your reference/model answer (markdown)…"
              minRows={6}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" />
            {isEditMode ? 'Save changes' : 'Create question'}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
