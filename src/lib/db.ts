import Dexie, { type Table } from 'dexie';
import type {
  Question,
  ReviewState,
  Note,
  Story,
  Company,
  MockSession,
} from '@/types';

class InterviewPrepDB extends Dexie {
  questions!: Table<Question, string>;
  reviewStates!: Table<ReviewState, string>;
  notes!: Table<Note, string>;
  stories!: Table<Story, string>;
  companies!: Table<Company, string>;
  mockSessions!: Table<MockSession, string>;

  constructor() {
    super('InterviewPrep');
    this.version(1).stores({
      questions: 'id, roundType, difficulty, source, *tags, *company, bookmarked',
      reviewStates: 'questionId, nextDue, confidence',
      notes: 'id, *tags, *linkedQuestionIds, updatedAt',
      stories: 'id, *tags',
      companies: 'id, archetype, applicationStatus',
      mockSessions: 'id, startedAt',
    });
  }
}

export const db = new InterviewPrepDB();
