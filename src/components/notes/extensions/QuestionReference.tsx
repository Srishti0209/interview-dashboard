import { Node, mergeAttributes } from '@tiptap/core';
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type ReactNodeViewProps,
} from '@tiptap/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ListChecks } from 'lucide-react';
import { useQuestion } from '@/hooks/useQuestions';
import { RoundPill, DifficultyBadge } from '@/components/QuestionMeta';

function QuestionRefView({ node }: ReactNodeViewProps) {
  const id = node.attrs.questionId as string;
  const q = useQuestion(id);

  return (
    <NodeViewWrapper
      className="my-2"
      data-question-id={id}
      contentEditable={false}
    >
      {q ? (
        <Link
          to={`/questions/${q.id}`}
          className="flex items-start gap-3 rounded-lg border bg-card p-3 no-underline transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <ListChecks className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-sm font-medium text-foreground">
              {q.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <RoundPill round={q.roundType} />
              <DifficultyBadge difficulty={q.difficulty} />
            </div>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : (
        <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          {q === null ? 'Linked question not found' : 'Loading question…'}
        </div>
      )}
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    questionReference: {
      insertQuestionReference: (questionId: string) => ReturnType;
    };
  }
}

export const QuestionReference = Node.create({
  name: 'questionReference',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      questionId: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-question-id') || '',
        renderHTML: (attrs) => ({ 'data-question-id': attrs.questionId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="question-reference"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'question-reference' }),
    ];
  },

  addCommands() {
    return {
      insertQuestionReference:
        (questionId) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { questionId },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestionRefView);
  },
});
