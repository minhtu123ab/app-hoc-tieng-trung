import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewRating,
  UserWordProgressDto,
  WordStatus,
} from '@linguaflow/shared';
import { ReviewDto } from '../common/dtos';

interface Sm2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueDate: Date;
  status: WordStatus;
}

@Injectable()
export class SrsService {
  constructor(private prisma: PrismaService) {}

  private applySm2(
    current: {
      easeFactor: number;
      intervalDays: number;
      repetitions: number;
    },
    rating: ReviewRating,
  ): Sm2Result {
    let { easeFactor, intervalDays, repetitions } = current;

    const qualityMap: Record<ReviewRating, number> = {
      AGAIN: 0,
      HARD: 3,
      GOOD: 4,
      EASY: 5,
    };
    const q = qualityMap[rating];

    if (q < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions += 1;
    }

    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
    );

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + intervalDays);

    let status: WordStatus;
    if (repetitions === 0) {
      status = WordStatus.FORGETTING;
    } else if (repetitions >= 5 && intervalDays >= 21) {
      status = WordStatus.MASTERED;
    } else if (repetitions >= 1) {
      status = WordStatus.LEARNING;
    } else {
      status = WordStatus.NEW;
    }

    return { easeFactor, intervalDays, repetitions, dueDate, status };
  }

  async getDueWords(userId: string): Promise<UserWordProgressDto[]> {
    const now = new Date();
    const items = await this.prisma.userWordProgress.findMany({
      where: {
        userId,
        dueDate: { lte: now },
      },
      include: { word: true },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    return items.map((item) => ({
      id: item.id,
      wordId: item.wordId,
      status: item.status as WordStatus,
      easeFactor: item.easeFactor,
      intervalDays: item.intervalDays,
      repetitions: item.repetitions,
      dueDate: item.dueDate.toISOString(),
      lastReviewedAt: item.lastReviewedAt?.toISOString() ?? null,
      word: {
        id: item.word.id,
        deckId: item.word.deckId,
        hanzi: item.word.hanzi,
        pinyin: item.word.pinyin,
        meaningVi: item.word.meaningVi,
        partOfSpeech: item.word.partOfSpeech,
        exampleHanzi: item.word.exampleHanzi,
        examplePinyin: item.word.examplePinyin,
        exampleVi: item.word.exampleVi,
        hskLevel: item.word.hskLevel as UserWordProgressDto['word'] extends infer W
          ? W extends { hskLevel: infer H }
            ? H
            : never
          : never,
      },
    }));
  }

  async review(userId: string, dto: ReviewDto) {
    const progress = await this.prisma.userWordProgress.findUnique({
      where: { userId_wordId: { userId, wordId: dto.wordId } },
    });
    if (!progress) {
      throw new NotFoundException('Từ vựng chưa được thêm vào tiến trình học');
    }

    const sm2 = this.applySm2(progress, dto.rating);
    const updated = await this.prisma.userWordProgress.update({
      where: { id: progress.id },
      data: {
        easeFactor: sm2.easeFactor,
        intervalDays: sm2.intervalDays,
        repetitions: sm2.repetitions,
        dueDate: sm2.dueDate,
        status: sm2.status,
        lastReviewedAt: new Date(),
      },
    });

    await this.prisma.reviewLog.create({
      data: {
        userWordProgressId: progress.id,
        rating: dto.rating,
        mode: dto.mode ?? null,
        isCorrect: dto.isCorrect ?? dto.rating !== ReviewRating.AGAIN,
      },
    });

    await this.updateStreak(userId);

    return {
      id: updated.id,
      wordId: updated.wordId,
      status: updated.status,
      easeFactor: updated.easeFactor,
      intervalDays: updated.intervalDays,
      repetitions: updated.repetitions,
      dueDate: updated.dueDate.toISOString(),
      lastReviewedAt: updated.lastReviewedAt?.toISOString() ?? null,
    };
  }

  private async updateStreak(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = user.lastStudyDate
      ? new Date(user.lastStudyDate)
      : null;
    if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

    let streakCount = user.streakCount;
    if (!lastStudy) {
      streakCount = 1;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 0) {
        // same day, keep streak
      } else if (diffDays === 1) {
        streakCount += 1;
      } else {
        streakCount = 1;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { streakCount, lastStudyDate: new Date() },
    });
  }
}
