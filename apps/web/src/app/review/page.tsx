'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, ErrorRetry } from '@/components/ui/states';
import type { UserWordProgressDto, StatsOverview } from '@linguaflow/shared';
import { ReviewRating, WordStatus } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { wordStatusLabel } from '@/lib/word-status';
import { Volume2, Brain, Lightbulb, CheckCircle2 } from 'lucide-react';

const STATUS_LEGEND = [
  WordStatus.NEW,
  WordStatus.LEARNING,
  WordStatus.FORGETTING,
  WordStatus.MASTERED,
] as const;

export default function ReviewPage() {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: dueWords,
    isLoading,
    error,
    refetch,
  } = useQuery<UserWordProgressDto[]>({
    queryKey: ['srs-due'],
    queryFn: async () => {
      const { data } = await api.get('/srs/due');
      return data;
    },
  });

  const { data: stats } = useQuery<StatsOverview>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/overview');
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (rating: ReviewRating) => {
      const word = dueWords![index];
      await api.post('/srs/review', {
        wordId: word.wordId,
        rating,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['srs-due'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowAnswer(false);
      setReviewedCount((c) => c + 1);
      if (index >= (dueWords?.length ?? 1) - 1) {
        setSessionDone(true);
      } else {
        setIndex(index + 1);
      }
    },
    onError: () => {
      /* error shown via isError */
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) {
    return (
      <ErrorRetry message="Không tải được danh sách ôn tập" onRetry={() => refetch()} />
    );
  }

  if (sessionDone || !dueWords?.length) {
    const empty = !dueWords?.length && !sessionDone;
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Ôn tập SRS"
          description="Hệ thống ôn tập ngắt quãng (Spaced Repetition)"
        />
        <Card className="mx-auto max-w-lg py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            {sessionDone ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <Brain className="h-8 w-8 text-emerald-600" />
            )}
          </div>
          <CardTitle>
            {sessionDone
              ? `Đã ôn ${reviewedCount} từ!`
              : empty
                ? 'Hoàn thành hôm nay!'
                : 'Hoàn thành phiên ôn'}
          </CardTitle>
          <p className="mt-2 text-muted">
            {sessionDone
              ? `Chuỗi ngày: ${stats?.streakCount ?? 0}. Quay lại sau hoặc luyện thêm.`
              : 'Không có từ nào cần ôn. Quay lại sau hoặc học từ mới.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/practice">
              <Button>Luyện tập</Button>
            </Link>
            <Link href="/generate">
              <Button variant="outline">Sinh từ AI</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const current = dueWords[index];
  const word = current.word!;
  const progress = ((index + 1) / dueWords.length) * 100;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Ôn tập SRS"
        description="Đánh giá mức nhớ từ — thuật toán SM-2 tự lên lịch ôn tiếp theo"
      />

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">
              Từ {index + 1} / {dueWords.length}
              {reviewedCount > 0 && (
                <span className="ml-2 text-muted">· Đã ôn {reviewedCount}</span>
              )}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-muted">
              Trạng thái:{' '}
              <strong className="text-foreground">
                {wordStatusLabel(current.status)}
              </strong>
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {reviewMutation.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Lỗi khi lưu đánh giá. Thử lại.
            </p>
          )}

          <Card className="px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="flex items-center justify-center gap-3">
              <p className="chinese-text text-6xl font-bold sm:text-7xl">{word.hanzi}</p>
              <Button variant="ghost" size="sm" onClick={() => speakChinese(word.hanzi)}>
                <Volume2 className="h-6 w-6" />
              </Button>
            </div>
            <p className="mt-3 text-lg text-muted">{word.pinyin}</p>

            {showAnswer ? (
              <div className="mt-8">
                <p className="text-2xl font-semibold">{word.meaningVi}</p>
                {word.exampleHanzi && (
                  <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-left">
                    <p className="chinese-text text-base">{word.exampleHanzi}</p>
                    {word.exampleVi && (
                      <p className="mt-1 text-sm text-muted">{word.exampleVi}</p>
                    )}
                  </div>
                )}
                <div className="mt-8 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => reviewMutation.mutate(ReviewRating.AGAIN)}
                    disabled={reviewMutation.isPending}
                  >
                    Quên
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => reviewMutation.mutate(ReviewRating.HARD)}
                    disabled={reviewMutation.isPending}
                  >
                    Khó
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => reviewMutation.mutate(ReviewRating.GOOD)}
                    disabled={reviewMutation.isPending}
                  >
                    Đúng
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => reviewMutation.mutate(ReviewRating.EASY)}
                    disabled={reviewMutation.isPending}
                  >
                    Dễ
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="mt-10 px-8" size="lg" onClick={() => setShowAnswer(true)}>
                Hiện đáp án
              </Button>
            )}
          </Card>

          <p className="text-center text-xs text-muted">
            Chỉ chuyển từ sau khi bạn đánh giá (Quên / Khó / Đúng / Dễ) — tránh sai lịch SRS.
          </p>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              Phiên hôm nay
            </CardTitle>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/80 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{dueWords.length}</p>
                <p className="text-xs text-muted">Từ cần ôn</p>
              </div>
              <div className="rounded-xl bg-white/80 p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.streakCount ?? 0}
                </p>
                <p className="text-xs text-muted">Chuỗi ngày</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle className="text-base">Ý nghĩa trạng thái</CardTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {STATUS_LEGEND.map((s) => (
                <li key={s} className="rounded-lg bg-slate-50 px-3 py-2 text-foreground">
                  {wordStatusLabel(s)}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Mẹo ôn hiệu quả
            </CardTitle>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>• Nhấn <strong className="text-foreground">Quên</strong> nếu không nhớ.</li>
              <li>• <strong className="text-foreground">Đúng</strong> khi nhớ được nghĩa.</li>
              <li>• <strong className="text-foreground">Dễ</strong> khi quá dễ — ôn xa hơn.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
