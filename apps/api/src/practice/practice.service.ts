import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from '../srs/srs.service';
import {
  PracticeMode,
  PracticeQuestion,
  ReviewRating,
  WordStatus,
} from '@linguaflow/shared';
import { GradePracticeDto } from '../common/dtos';
import { Word } from '@prisma/client';

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

  private blankWordInSentence(sentence: string, hanzi: string): string {
    const idx = sentence.indexOf(hanzi);
    if (idx < 0) return sentence;
    return sentence.slice(0, idx) + '___' + sentence.slice(idx + hanzi.length);
  }

  private pickWords(
    progress: Array<{ word: Word; dueDate: Date; status: string }>,
    limit: number,
  ): Word[] {
    const now = new Date();
    const due = progress.filter((p) => p.dueDate <= now);
    const notDue = progress.filter((p) => p.dueDate > now);

    const sortByPriority = (
      items: typeof progress,
    ) =>
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
    const words: Word[] = [];
    for (const p of pool) {
      if (words.length >= limit) break;
      if (!seen.has(p.word.id)) {
        seen.add(p.word.id);
        words.push(p.word);
      }
    }
    return words;
  }

  async getQuestions(
    userId: string,
    mode: PracticeMode,
    limit = 10,
    deckId?: string,
  ): Promise<PracticeQuestion[]> {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 500);
    const poolSize = Math.max(safeLimit * 3, 80);

    const progress = await this.prisma.userWordProgress.findMany({
      where: {
        userId,
        ...(deckId ? { word: { deckId } } : {}),
      },
      include: { word: true },
      orderBy: { dueDate: 'asc' },
      take: poolSize,
    });

    if (progress.length === 0) {
      throw new BadRequestException('Chưa có từ vựng để luyện tập');
    }

    const words = this.pickWords(progress, Math.min(safeLimit, progress.length));
    const allMeanings = [
      ...new Set(progress.map((p) => p.word.meaningVi)),
    ];

    return words.map((word, i) => {
      switch (mode) {
        case PracticeMode.HAN_TO_VIET: {
          const distractors = this.shuffle(
            allMeanings.filter((m) => m !== word.meaningVi),
          ).slice(0, 3);
          const options = this.shuffle([
            word.meaningVi,
            ...distractors,
          ]);
          return {
            id: `q-${i}`,
            mode,
            prompt: word.hanzi,
            hint: word.pinyin,
            options,
            answer: word.meaningVi,
            wordId: word.id,
          };
        }

        case PracticeMode.VIET_TO_HAN:
          return {
            id: `q-${i}`,
            mode,
            prompt: word.meaningVi,
            hint: word.pinyin,
            answer: word.hanzi,
            wordId: word.id,
          };

        case PracticeMode.LISTEN_TYPE:
          return {
            id: `q-${i}`,
            mode,
            prompt: word.hanzi,
            hint: word.pinyin,
            answer: word.hanzi,
            wordId: word.id,
          };

        case PracticeMode.FILL_BLANK: {
          const example = word.exampleHanzi ?? `我喜欢${word.hanzi}`;
          const filled = this.blankWordInSentence(example, word.hanzi);
          return {
            id: `q-${i}`,
            mode,
            prompt: filled,
            hint: word.pinyin,
            answer: word.hanzi,
            wordId: word.id,
          };
        }

        case PracticeMode.SENTENCE_ORDER: {
          const sentence = word.exampleHanzi ?? `我喜欢${word.hanzi}`;
          const tokens =
            sentence.match(/[\u4e00-\u9fff]+|[^\u4e00-\u9fff\s]+/g) ?? [
              sentence,
            ];
          return {
            id: `q-${i}`,
            mode,
            prompt: 'Sắp xếp thành câu đúng',
            tokens: this.shuffle(tokens),
            answer: sentence,
            wordId: word.id,
          };
        }

        case PracticeMode.AI_CONVERSATION:
          return {
            id: `q-${i}`,
            mode,
            prompt: `Hãy trả lời bằng tiếng Trung (có thể kèm pinyin trong ngoặc). Tình huống: bạn muốn dùng từ **${word.hanzi}** (${word.meaningVi}) trong hội thoại.`,
            hint: `Gợi ý: ${word.exampleHanzi ?? word.hanzi}`,
            answer: word.exampleHanzi ?? word.hanzi,
            wordId: word.id,
          };

        default:
          return {
            id: `q-${i}`,
            mode,
            prompt: word.hanzi,
            answer: word.meaningVi,
            wordId: word.id,
          };
      }
    });
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
      (correctNorm.length > 1 &&
        userNorm.includes(correctNorm));

    if (dto.wordId) {
      const rating = isCorrect ? ReviewRating.GOOD : ReviewRating.HARD;
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
