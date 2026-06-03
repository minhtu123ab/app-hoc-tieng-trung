'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import type { UserWordProgressDto, StatsOverview } from '@linguaflow/shared';
import { ReviewRating, WordStatus } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { wordStatusLabel } from '@/lib/word-status';
import { Volume2, Brain, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LEGEND = [
  WordStatus.NEW,
  WordStatus.LEARNING,
  WordStatus.FORGETTING,
  WordStatus.MASTERED,
] as const;

export default function ReviewPage() {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const queryClient = useQueryClient();

  const { data: dueWords, isLoading } = useQuery<UserWordProgressDto[]>({
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
      if (index < (dueWords?.length ?? 1) - 1) {
        setIndex(index + 1);
      } else {
        setIndex(0);
      }
    },
  });

  if (isLoading) return <div className="text-muted">Đang tải...</div>;

  if (!dueWords?.length) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Ôn tập SRS"
          description="Hệ thống ôn tập ngắt quãng (Spaced Repetition)"
        />
        <Card className="mx-auto max-w-lg py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Brain className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle>Hoàn thành hôm nay!</CardTitle>
          <p className="mt-2 text-muted">Không có từ nào cần ôn. Quay lại sau hoặc học từ mới.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/generate">
              <Button variant="outline">Sinh từ AI</Button>
            </Link>
            <Link href="/practice">
              <Button>Luyện tập</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const current = dueWords[index];
  const word = current.word!;
  const progress = ((index + 1) / dueWords.length) * 100;

  const goPrev = () => {
    setShowAnswer(false);
    setIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setShowAnswer(false);
    setIndex((i) => Math.min(dueWords.length - 1, i + 1));
  };

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
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-muted">
              Trạng thái:{' '}
              <strong className="text-foreground">{wordStatusLabel(current.status)}</strong>
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

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
                <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md sm:mx-auto">
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

          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Từ trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={index >= dueWords.length - 1}
            >
              Từ sau <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
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
              <li>• Nhấn <strong className="text-foreground">Quên</strong> nếu không nhớ — từ sẽ ôn lại sớm hơn.</li>
              <li>• <strong className="text-foreground">Đúng</strong> khi nhớ được nghĩa (không cần nhớ pinyin).</li>
              <li>• <strong className="text-foreground">Dễ</strong> khi quá dễ — khoảng cách ôn sẽ dài hơn.</li>
              <li>• Ôn hết danh sách mỗi ngày trước khi luyện tập mới.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
