export enum HskLevel {
  HSK1 = 'HSK1',
  HSK2 = 'HSK2',
  HSK3 = 'HSK3',
  HSK4 = 'HSK4',
  HSK5 = 'HSK5',
  HSK6 = 'HSK6',
  ADVANCED = 'ADVANCED',
}

export enum DeckSource {
  AI = 'AI',
  MANUAL = 'MANUAL',
}

export enum WordStatus {
  NEW = 'NEW',
  LEARNING = 'LEARNING',
  FORGETTING = 'FORGETTING',
  MASTERED = 'MASTERED',
}

export enum ReviewRating {
  AGAIN = 'AGAIN',
  HARD = 'HARD',
  GOOD = 'GOOD',
  EASY = 'EASY',
}

export enum PracticeMode {
  VIET_TO_HAN = 'VIET_TO_HAN',
  HAN_TO_VIET = 'HAN_TO_VIET',
  LISTEN_TYPE = 'LISTEN_TYPE',
  FILL_BLANK = 'FILL_BLANK',
  SENTENCE_ORDER = 'SENTENCE_ORDER',
  AI_CONVERSATION = 'AI_CONVERSATION',
}

export enum TutorRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  hskLevel: HskLevel;
  streakCount: number;
  lastStudyDate: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: UserDto;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  hskLevel?: HskLevel;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface WordDto {
  id: string;
  deckId: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech: string | null;
  exampleHanzi: string | null;
  examplePinyin: string | null;
  exampleVi: string | null;
  hskLevel: HskLevel;
}

export interface DeckDto {
  id: string;
  userId: string;
  title: string;
  topic: string;
  hskLevel: HskLevel;
  source: DeckSource;
  wordCount?: number;
  createdAt: string;
}

export interface GenerateVocabDto {
  topic: string;
  hskLevel: HskLevel;
  count: number;
}

export interface GeneratedWord {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech?: string;
  exampleHanzi?: string;
  examplePinyin?: string;
  exampleVi?: string;
}

export interface UserWordProgressDto {
  id: string;
  wordId: string;
  status: WordStatus;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueDate: string;
  lastReviewedAt: string | null;
  word?: WordDto;
}

export interface ReviewDto {
  wordId: string;
  rating: ReviewRating;
  mode?: PracticeMode;
  isCorrect?: boolean;
}

export interface PracticeQuestion {
  id: string;
  mode: PracticeMode;
  prompt: string;
  hint?: string;
  options?: string[];
  tokens?: string[];
  answer: string;
  wordId?: string;
}

export interface GradePracticeDto {
  mode: PracticeMode;
  wordId?: string;
  userAnswer: string;
  correctAnswer: string;
}

export interface TutorAskDto {
  question: string;
  context?: string;
}

export interface TutorChatDto {
  message: string;
  role?: 'teacher' | 'friend' | 'customer' | 'shopkeeper';
}

export interface StatsOverview {
  wordsLearned: number;
  wordsMastered: number;
  wordsForgetting: number;
  wordsDueToday: number;
  streakCount: number;
  accuracyByMode: Record<string, { total: number; correct: number; accuracy: number }>;
  progressOverTime: Array<{ date: string; reviews: number; correct: number }>;
}

export const TOPICS = [
  'Du lịch',
  'Công nghệ',
  'Game',
  'Kinh doanh',
  'Đời sống',
  'Phim ảnh',
  'Mạng xã hội',
] as const;

export type Topic = (typeof TOPICS)[number];
