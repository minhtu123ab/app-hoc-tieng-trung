import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from '../srs/srs.service';
import {
  PracticeMode,
  PracticeQuestion,
  ReviewRating,
} from '@linguaflow/shared';
import { GradePracticeDto } from '../common/dtos';
import { Sentence, Word } from '../generated/prisma/client';

type WordProgressRow = {
  word: Word;
  dueDate: Date;
  status: string;
};

type SentenceProgressRow = {
  sentence: Sentence;
  dueDate: Date;
  status: string;
};

@Injectable()
export class PracticeService {
  constructor(
    private prisma: PrismaService,
    private srs: SrsService,
  ) {}

  private shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  private tokenizeChineseSentence(sentence: string): string[] {
    const chars = [...sentence.replace(/\s+/g, '')];
    const hanziChars = chars.filter((c) => /[\u4e00-\u9fff]/.test(c));
    if (hanziChars.length >= 2) return hanziChars;
    const segments =
      sentence.match(/[\u4e00-\u9fff]+|[^\u4e00-\u9fff\s]+/g) ?? [sentence];
    return segments.filter((s) => s.trim().length > 0);
  }

  private getSentenceTokens(sentence: Sentence): string[] {
    if (sentence.tokens?.length >= 2) return [...sentence.tokens];
    return this.tokenizeChineseSentence(sentence.hanzi);
  }

  private shuffleUntilDifferent(tokens: string[], answer: string): string[] {
    if (tokens.length < 2) return tokens;
    const correctOrder = answer.replace(/\s+/g, '');
    let shuffled = this.shuffle(tokens);
    let attempts = 0;
    while (shuffled.join('') === correctOrder && attempts < 20) {
      shuffled = this.shuffle(tokens);
      attempts++;
    }
    return shuffled;
  }

  private buildWordBankTokens(
    correctTokens: string[],
    poolTokens: string[][],
    targetCount = 12,
  ): string[] {
    const correct = [...correctTokens];
    const distractorPool = poolTokens
      .flat()
      .filter((t) => !correct.includes(t));
    const uniqueDistractors = [...new Set(distractorPool)];
    const distractorCount = Math.min(
      Math.max(3, targetCount - correct.length),
      uniqueDistractors.length,
    );
    const picked = this.shuffle(uniqueDistractors).slice(0, distractorCount);
    return this.shuffle([...correct, ...picked]);
  }

  private blankWordInSentence(sentence: string, hanzi: string): string {
    const idx = sentence.indexOf(hanzi);
    if (idx < 0) return sentence;
    return sentence.slice(0, idx) + '___' + sentence.slice(idx + hanzi.length);
  }

  private pickFromProgress<T extends { id: string }>(
    progress: Array<{ item: T; dueDate: Date; status: string }>,
    limit: number,
  ): T[] {
    const now = new Date();
    const due = progress.filter((p) => p.dueDate <= now);
    const notDue = progress.filter((p) => p.dueDate > now);

    const sortByPriority = (items: typeof progress) =>
      [...items].sort((a, b) => {
        const statusScore = (s: string) => {
          if (s === 'FORGETTING') return 0;
          if (s === 'NEW') return 1;
          if (s === 'LEARNING') return 2;
          return 3;
        };
        const diff = statusScore(a.status) - statusScore(b.status);
        if (diff !== 0) return diff;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

    const pool = [
      ...this.shuffle(sortByPriority(due)),
      ...this.shuffle(sortByPriority(notDue)),
    ];
    const seen = new Set<string>();
    const items: T[] = [];
    for (const p of pool) {
      if (items.length >= limit) break;
      if (!seen.has(p.item.id)) {
        seen.add(p.item.id);
        items.push(p.item);
      }
    }
    return items;
  }

  async getQuestions(
    userId: string,
    mode: PracticeMode,
    limit = 10,
    deckId?: string,
    scope: 'all' | 'due' = 'all',
    source: 'words' | 'sentences' = 'words',
    sentenceDeckId?: string,
  ): Promise<PracticeQuestion[]> {
    if (source === 'sentences') {
      return this.getSentenceQuestions(
        userId,
        mode,
        limit,
        scope,
        sentenceDeckId,
      );
    }
    return this.getWordQuestions(userId, mode, limit, deckId, scope);
  }

  private async getWordQuestions(
    userId: string,
    mode: PracticeMode,
    limit: number,
    deckId?: string,
    scope: 'all' | 'due' = 'all',
  ): Promise<PracticeQuestion[]> {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 500);
    const poolSize = Math.max(safeLimit * 3, 80);
    const now = new Date();

    const progress = await this.prisma.userWordProgress.findMany({
      where: {
        userId,
        ...(scope === 'due' ? { dueDate: { lte: now } } : {}),
        ...(deckId ? { word: { deckId } } : {}),
      },
      include: { word: true },
      orderBy: { dueDate: 'asc' },
      take: poolSize,
    });

    if (progress.length === 0) {
      throw new BadRequestException('Chưa có từ vựng để luyện tập');
    }

    const wordProgress: WordProgressRow[] = progress.map((p) => ({
      word: p.word,
      dueDate: p.dueDate,
      status: p.status,
    }));

    const words = this.pickFromProgress(
      wordProgress.map((p) => ({
        item: p.word,
        dueDate: p.dueDate,
        status: p.status,
      })),
      mode === PracticeMode.MATCH_PAIRS
        ? Math.min(Math.max(4, Math.floor(safeLimit / 1) * 4), progress.length)
        : Math.min(safeLimit, progress.length),
    );

    if (mode === PracticeMode.MATCH_PAIRS) {
      return this.buildMatchPairQuestions(words);
    }

    const allMeanings = [...new Set(progress.map((p) => p.word.meaningVi))];
    const allTokenPools = words.map((w) =>
      this.tokenizeChineseSentence(w.exampleHanzi ?? w.hanzi),
    );

    const questions: PracticeQuestion[] = [];
    let qi = 0;
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      const built = this.buildWordQuestion(
        mode,
        word,
        allMeanings,
        allTokenPools,
        wi,
      );
      if (built) {
        questions.push({ ...built, id: `q-${qi}` });
        qi++;
      }
    }
    return questions;
  }

  private buildMatchPairQuestions(words: Word[]): PracticeQuestion[] {
    const questions: PracticeQuestion[] = [];
    const batchSize = 4;
    for (let i = 0; i + 1 < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      if (batch.length < 2) continue;
      questions.push({
        id: `q-${questions.length}`,
        mode: PracticeMode.MATCH_PAIRS,
        prompt: 'Ghép cặp chữ Hán với nghĩa tiếng Việt',
        matchPairs: batch.map((w, j) => ({
          key: `p-${j}`,
          hanzi: w.hanzi,
          meaningVi: w.meaningVi,
          wordId: w.id,
        })),
        answer: 'matched',
      });
    }
    return questions;
  }

  private buildWordQuestion(
    mode: PracticeMode,
    word: Word,
    allMeanings: string[],
    allTokenPools: string[][],
    wordIndex: number,
  ): Omit<PracticeQuestion, 'id'> | null {
    switch (mode) {
      case PracticeMode.HAN_TO_VIET: {
        const distractors = this.shuffle(
          allMeanings.filter((m) => m !== word.meaningVi),
        ).slice(0, 3);
        return {
          mode,
          prompt: word.hanzi,
          hint: word.pinyin,
          options: this.shuffle([word.meaningVi, ...distractors]),
          answer: word.meaningVi,
          wordId: word.id,
        };
      }
      case PracticeMode.VIET_TO_HAN:
        return {
          mode,
          prompt: word.meaningVi,
          hint: word.pinyin,
          answer: word.hanzi,
          wordId: word.id,
        };
      case PracticeMode.LISTEN_TYPE:
        return {
          mode,
          prompt: word.hanzi,
          hint: word.pinyin,
          answer: word.hanzi,
          wordId: word.id,
        };
      case PracticeMode.FILL_BLANK: {
        const example = word.exampleHanzi ?? `我喜欢${word.hanzi}`;
        return {
          mode,
          prompt: this.blankWordInSentence(example, word.hanzi),
          hint: word.pinyin,
          answer: word.hanzi,
          wordId: word.id,
        };
      }
      case PracticeMode.SENTENCE_ORDER: {
        const sentence = word.exampleHanzi ?? `我喜欢${word.hanzi}`;
        const tokens = this.tokenizeChineseSentence(sentence);
        if (tokens.length < 2) return null;
        return {
          mode,
          prompt: 'Sắp xếp thành câu đúng',
          tokens: this.shuffleUntilDifferent(tokens, sentence),
          answer: sentence.replace(/\s+/g, ''),
          wordId: word.id,
        };
      }
      case PracticeMode.WORD_BANK: {
        const hanzi = word.exampleHanzi ?? word.hanzi;
        const correctTokens = this.tokenizeChineseSentence(hanzi);
        if (correctTokens.length < 2) return null;
        const pool = allTokenPools.filter((_, i) => i !== wordIndex);
        return {
          mode,
          prompt: word.exampleVi ?? word.meaningVi,
          hint: word.pinyin,
          tokens: this.buildWordBankTokens(correctTokens, pool),
          answer: hanzi.replace(/\s+/g, ''),
          wordId: word.id,
        };
      }
      case PracticeMode.AI_CONVERSATION:
        return {
          mode,
          prompt: `Hãy trả lời bằng tiếng Trung (có thể kèm pinyin trong ngoặc). Tình huống: bạn muốn dùng từ **${word.hanzi}** (${word.meaningVi}) trong hội thoại.`,
          hint: `Gợi ý: ${word.exampleHanzi ?? word.hanzi}`,
          answer: word.exampleHanzi ?? word.hanzi,
          wordId: word.id,
        };
      default:
        return {
          mode,
          prompt: word.hanzi,
          answer: word.meaningVi,
          wordId: word.id,
        };
    }
  }

  private async getSentenceQuestions(
    userId: string,
    mode: PracticeMode,
    limit: number,
    scope: 'all' | 'due' = 'all',
    sentenceDeckId?: string,
  ): Promise<PracticeQuestion[]> {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 500);
    const poolSize = Math.max(safeLimit * 3, 80);
    const now = new Date();

    const sentenceModes = [
      PracticeMode.SENTENCE_ORDER,
      PracticeMode.WORD_BANK,
      PracticeMode.LISTEN_TYPE,
      PracticeMode.FILL_BLANK,
    ];
    if (!sentenceModes.includes(mode)) {
      throw new BadRequestException('Chế độ này không hỗ trợ nguồn câu');
    }

    const progress = await this.prisma.userSentenceProgress.findMany({
      where: {
        userId,
        ...(scope === 'due' ? { dueDate: { lte: now } } : {}),
        ...(sentenceDeckId ? { sentence: { sentenceDeckId } } : {}),
      },
      include: { sentence: true },
      orderBy: { dueDate: 'asc' },
      take: poolSize,
    });

    if (progress.length === 0) {
      throw new BadRequestException('Chưa có câu để luyện tập');
    }

    const sentences = this.pickFromProgress(
      progress.map((p) => ({
        item: p.sentence,
        dueDate: p.dueDate,
        status: p.status,
      })),
      Math.min(safeLimit, progress.length),
    );

    const allTokenPools = sentences.map((s) => this.getSentenceTokens(s));

    const questions: PracticeQuestion[] = [];
    let qi = 0;
    for (let si = 0; si < sentences.length; si++) {
      const sentence = sentences[si];
      const built = this.buildSentenceQuestion(
        mode,
        sentence,
        allTokenPools,
        si,
      );
      if (built) {
        questions.push({ ...built, id: `q-${qi}` });
        qi++;
      }
    }
    return questions;
  }

  private buildSentenceQuestion(
    mode: PracticeMode,
    sentence: Sentence,
    allTokenPools: string[][],
    sentenceIndex: number,
  ): Omit<PracticeQuestion, 'id'> | null {
    const hanzi = sentence.hanzi.replace(/\s+/g, '');
    const tokens = this.getSentenceTokens(sentence);

    switch (mode) {
      case PracticeMode.LISTEN_TYPE:
        return {
          mode,
          prompt: sentence.hanzi,
          hint: sentence.pinyin,
          answer: hanzi,
          sentenceId: sentence.id,
        };
      case PracticeMode.FILL_BLANK: {
        const blankTarget = tokens[Math.floor(tokens.length / 2)] ?? tokens[0];
        if (!blankTarget) return null;
        return {
          mode,
          prompt: this.blankWordInSentence(sentence.hanzi, blankTarget),
          hint: sentence.pinyin,
          answer: blankTarget,
          sentenceId: sentence.id,
        };
      }
      case PracticeMode.SENTENCE_ORDER:
        if (tokens.length < 2) return null;
        return {
          mode,
          prompt: sentence.meaningVi,
          hint: sentence.pinyin,
          tokens: this.shuffleUntilDifferent(tokens, hanzi),
          answer: hanzi,
          sentenceId: sentence.id,
        };
      case PracticeMode.WORD_BANK:
        if (tokens.length < 2) return null;
        return {
          mode,
          prompt: sentence.meaningVi,
          hint: sentence.pinyin,
          tokens: this.buildWordBankTokens(
            tokens,
            allTokenPools.filter((_, i) => i !== sentenceIndex),
          ),
          answer: hanzi,
          sentenceId: sentence.id,
        };
      default:
        return null;
    }
  }

  normalizeChinese(text: string): string {
    return text.trim().replace(/\s+/g, '');
  }

  async grade(userId: string, dto: GradePracticeDto) {
    const userNorm = this.normalizeChinese(dto.userAnswer);
    const correctNorm = this.normalizeChinese(dto.correctAnswer);
    const isCorrect =
      userNorm === correctNorm ||
      userNorm.toLowerCase() === correctNorm.toLowerCase() ||
      (correctNorm.length > 1 && userNorm.includes(correctNorm));

    const rating = isCorrect ? ReviewRating.GOOD : ReviewRating.HARD;

    if (dto.sentenceId) {
      await this.srs.reviewSentence(userId, {
        sentenceId: dto.sentenceId,
        rating,
        mode: dto.mode,
        isCorrect,
      });
    } else if (dto.wordId) {
      await this.srs.review(userId, {
        wordId: dto.wordId,
        rating,
        mode: dto.mode,
        isCorrect,
      });
    }

    return { isCorrect, correctAnswer: dto.correctAnswer };
  }

  async startSession(userId: string, mode: PracticeMode) {
    return this.prisma.practiceSession.create({
      data: { userId, mode, total: 0, correct: 0 },
    });
  }

  async endSession(
    sessionId: string,
    userId: string,
    total: number,
    correct: number,
  ) {
    const result = await this.prisma.practiceSession.updateMany({
      where: { id: sessionId, userId },
      data: { total, correct, endedAt: new Date() },
    });
    if (result.count === 0) {
      throw new BadRequestException('Không tìm thấy phiên luyện tập');
    }
    return this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });
  }
}
