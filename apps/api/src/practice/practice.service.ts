import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from '../srs/srs.service';
import {
  PracticeMode,
  PracticeQuestion,
  ReviewRating,
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
    return [...arr].sort(() => Math.random() - 0.5);
  }

  async getQuestions(
    userId: string,
    mode: PracticeMode,
    limit = 10,
  ): Promise<PracticeQuestion[]> {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 10, 1), 500);
    const poolSize = Math.max(safeLimit, 50);

    const progress = await this.prisma.userWordProgress.findMany({
      where: { userId },
      include: { word: true },
      take: poolSize,
    });

    if (progress.length === 0) {
      throw new BadRequestException('Chưa có từ vựng để luyện tập');
    }

    const words = this.shuffle(progress.map((p) => p.word)).slice(
      0,
      Math.min(safeLimit, progress.length),
    ) as Word[];
    const allMeanings = progress.map((p) => p.word.meaningVi);

    return words.map((word, i) => {
      switch (mode) {
        case PracticeMode.HAN_TO_VIET:
          return {
            id: `q-${i}`,
            mode,
            prompt: word.hanzi,
            hint: word.pinyin,
            options: this.shuffle([
              word.meaningVi,
              ...this.shuffle(allMeanings.filter((m) => m !== word.meaningVi)).slice(0, 3),
            ]),
            answer: word.meaningVi,
            wordId: word.id,
          };

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
          const example = word.exampleHanzi ?? `我是${word.hanzi}`;
          const filled = example.replace(word.hanzi, '___');
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
          const tokens = sentence.match(/[\u4e00-\u9fff]+|[^\u4e00-\u9fff\s]+/g) ?? [sentence];
          return {
            id: `q-${i}`,
            mode,
            prompt: 'Sắp xếp thành câu đúng',
            tokens: this.shuffle(tokens),
            answer: sentence,
            wordId: word.id,
          };
        }

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
      userNorm.toLowerCase() === correctNorm.toLowerCase();

    if (dto.wordId) {
      await this.srs.review(userId, {
        wordId: dto.wordId,
        rating: isCorrect ? ReviewRating.GOOD : ReviewRating.AGAIN,
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
    return this.prisma.practiceSession.updateMany({
      where: { id: sessionId, userId },
      data: { total, correct, endedAt: new Date() },
    });
  }
}
