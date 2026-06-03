import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatsOverview } from '@linguaflow/shared';
import { PracticeMode } from '@linguaflow/shared';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string): Promise<StatsOverview> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();

    const [statusCounts, wordsDueNow, reviewLogs, sessions, decks] =
      await Promise.all([
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
        }),
        this.prisma.practiceSession.findMany({
          where: { userId, endedAt: { not: null } },
        }),
        this.prisma.deck.findMany({
          where: { userId },
          include: {
            words: {
              include: {
                progress: { where: { userId } },
              },
            },
          },
        }),
      ]);

    const countByStatus = (status: string) =>
      statusCounts.find((s) => s.status === status)?._count ?? 0;

    const accuracyByMode: StatsOverview['accuracyByMode'] = {};
    for (const log of reviewLogs) {
      if (!log.mode) continue;
      const mode = log.mode as PracticeMode;
      if (!accuracyByMode[mode]) {
        accuracyByMode[mode] = { total: 0, correct: 0, accuracy: 0 };
      }
      accuracyByMode[mode].total += 1;
      if (log.isCorrect) accuracyByMode[mode].correct += 1;
    }
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

    const deckStats = decks.map((deck) => {
      const progress = deck.words.flatMap((w) => w.progress);
      const byStatus: Record<string, number> = {};
      for (const p of progress) {
        byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      }
      return {
        deckId: deck.id,
        title: deck.title,
        wordCount: deck.words.length,
        learned: progress.filter((p) => p.status !== 'NEW').length,
        mastered: byStatus['MASTERED'] ?? 0,
      };
    });

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const reviewsToday = reviewLogs.filter(
      (l) => l.reviewedAt >= todayStart,
    ).length;
    const dailyGoal = user?.dailyGoal ?? 20;

    return {
      wordsLearned:
        countByStatus('LEARNING') +
        countByStatus('FORGETTING') +
        countByStatus('MASTERED'),
      wordsMastered: countByStatus('MASTERED'),
      wordsForgetting: countByStatus('FORGETTING'),
      wordsDueToday: wordsDueNow,
      wordsDueNow,
      streakCount: user?.streakCount ?? 0,
      accuracyByMode,
      progressOverTime,
      deckStats,
      dailyGoal,
      reviewsToday,
      dailyGoalProgress:
        dailyGoal > 0
          ? Math.min(100, Math.round((reviewsToday / dailyGoal) * 100))
          : 0,
    };
  }
}
