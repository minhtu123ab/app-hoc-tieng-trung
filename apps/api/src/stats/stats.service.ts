import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsOverview } from '@linguaflow/shared';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string): Promise<StatsOverview> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();

    const [statusCounts, dueToday, reviewLogs, sessions] = await Promise.all([
      this.prisma.userWordProgress.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      this.prisma.userWordProgress.count({
        where: { userId, dueDate: { lte: now } },
      }),
      this.prisma.reviewLog.findMany({
        where: {
          userWordProgress: { userId },
          reviewedAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: { userWordProgress: true },
      }),
      this.prisma.practiceSession.findMany({
        where: { userId },
      }),
    ]);

    const countByStatus = (status: string) =>
      statusCounts.find((s) => s.status === status)?._count ?? 0;

    const accuracyByMode: StatsOverview['accuracyByMode'] = {};
    for (const session of sessions) {
      if (!accuracyByMode[session.mode]) {
        accuracyByMode[session.mode] = { total: 0, correct: 0, accuracy: 0 };
      }
      accuracyByMode[session.mode].total += session.total;
      accuracyByMode[session.mode].correct += session.correct;
    }
    for (const mode of Object.keys(accuracyByMode)) {
      const m = accuracyByMode[mode];
      m.accuracy = m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0;
    }

    const progressMap = new Map<string, { reviews: number; correct: number }>();
    for (const log of reviewLogs) {
      const date = log.reviewedAt.toISOString().split('T')[0];
      const entry = progressMap.get(date) ?? { reviews: 0, correct: 0 };
      entry.reviews += 1;
      if (log.isCorrect) entry.correct += 1;
      progressMap.set(date, entry);
    }

    const progressOverTime = Array.from(progressMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      wordsLearned:
        countByStatus('LEARNING') +
        countByStatus('FORGETTING') +
        countByStatus('MASTERED'),
      wordsMastered: countByStatus('MASTERED'),
      wordsForgetting: countByStatus('FORGETTING'),
      wordsDueToday: dueToday,
      streakCount: user?.streakCount ?? 0,
      accuracyByMode,
      progressOverTime,
    };
  }
}
