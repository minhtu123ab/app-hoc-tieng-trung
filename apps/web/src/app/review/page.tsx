'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, ErrorRetry } from '@/components/ui/states';
import type {
  StatsOverview,
  UserSentenceProgressDto,
  UserWordProgressDto,
} from '@linguaflow/shared';
import { ReviewRating, WordStatus } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { wordStatusLabel } from '@/lib/word-status';
import { Volume2, Brain, Lightbulb, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LEGEND = [
  WordStatus.NEW,
  WordStatus.LEARNING,
  WordStatus.FORGETTING,
  WordStatus.MASTERED,
] as const;

type ReviewKind = 'words' | 'sentences';

export default function ReviewPage() {
  const [kind, setKind] = useState<ReviewKind>('words');
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: dueItems,
    isLoading,
    error,
    refetch,
  } = useQuery<UserWordProgressDto[] | UserSentenceProgressDto[]>({
    queryKey: ['srs-due', kind],
    queryFn: async () => {
      const { data } = await api.get(`/srs/due?kind=${kind}`);
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
      const item = dueItems![index];
      if (kind === 'sentences') {
        const sentence = item as UserSentenceProgressDto;
        await api.post('/srs/review', {
          sentenceId: sentence.sentenceId,
          rating,
        });
      } else {
        const word = item as UserWordProgressDto;
        await api.post('/srs/review', {
          wordId: word.wordId,
          rating,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['srs-due'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setShowAnswer(false);
      setReviewedCount((c) => c + 1);
      if (index >= (dueItems?.length ?? 1) - 1) {
        setSessionDone(true);
      } else {
        setIndex(index + 1);
      }
    },
  });

  const switchKind = (next: ReviewKind) => {
    setKind(next);
    setIndex(0);
    setShowAnswer(false);
    setReviewedCount(0);
    setSessionDone(false);
  };

  if (isLoading) return <PageSkeleton />;
  if (error) {
    return (
      <ErrorRetry message="Không tải được danh sách ôn tập" onRetry={() => refetch()} />
    );
  }

  const dueCount =
    kind === 'words' ? (stats?.wordsDueNow ?? 0) : (stats?.sentencesDueNow ?? 0);
  const itemLabel = kind === 'words' ? 'từ' : 'câu';
  const itemLabelCap = kind === 'words' ? 'Từ' : 'Câu';

  if (sessionDone || !dueItems?.length) {
    const empty = !dueItems?.length && !sessionDone;
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Ôn tập SRS"
          description="Hệ thống ôn tập ngắt quãng (Spaced Repetition)"
        />
        <KindTabs kind={kind} onChange={switchKind} />
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
              ? `Đã ôn ${reviewedCount} ${itemLabel}!`
              : empty
                ? 'Hoàn thành hôm nay!'
                : 'Hoàn thành phiên ôn'}
          </CardTitle>
          <p className="mt-2 text-muted">
            {sessionDone
              ? `Chuỗi ngày: ${stats?.streakCount ?? 0}. Quay lại sau hoặc luyện thêm.`
              : `Không có ${itemLabel} nào cần ôn. Quay lại sau hoặc học thêm.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/practice">
              <Button>Luyện tập</Button>
            </Link>
            <Link href="/generate">
              <Button variant="outline">
                {kind === 'words' ? 'Sinh từ AI' : 'Sinh câu AI'}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const current = dueItems[index];
  const progress = ((index + 1) / dueItems.length) * 100;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Ôn tập SRS"
        description="Đánh giá mức nhớ — thuật toán SM-2 tự lên lịch ôn tiếp theo"
      />

      <KindTabs kind={kind} onChange={switchKind} />

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">
              {itemLabelCap} {index + 1} / {dueItems.length}
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
            {kind === 'words' ? (
              <WordReviewCard
                item={current as UserWordProgressDto}
                showAnswer={showAnswer}
                onSpeak={speakChinese}
              />
            ) : (
              <SentenceReviewCard
                item={current as UserSentenceProgressDto}
                showAnswer={showAnswer}
                onSpeak={speakChinese}
              />
            )}

            {showAnswer ? (
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
            ) : (
              <Button className="mt-10 px-8" size="lg" onClick={() => setShowAnswer(true)}>
                Hiện đáp án
              </Button>
            )}
          </Card>

          <p className="text-center text-xs text-muted">
            Chỉ chuyển {itemLabel} sau khi bạn đánh giá (Quên / Khó / Đúng / Dễ) — tránh sai lịch SRS.
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
                <p className="text-2xl font-bold text-primary">{dueCount}</p>
                <p className="text-xs text-muted">
                  {kind === 'words' ? 'Từ cần ôn' : 'Câu cần ôn'}
                </p>
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

function KindTabs({
  kind,
  onChange,
}: {
  kind: ReviewKind;
  onChange: (kind: ReviewKind) => void;
}) {
  return (
    <div className="flex gap-2">
      {(
        [
          { id: 'words' as const, label: 'Từ vựng' },
          { id: 'sentences' as const, label: 'Câu' },
        ] as const
      ).map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            kind === id
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-muted hover:bg-slate-200',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WordReviewCard({
  item,
  showAnswer,
  onSpeak,
}: {
  item: UserWordProgressDto;
  showAnswer: boolean;
  onSpeak: (text: string) => void;
}) {
  const word = item.word!;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <p className="chinese-text text-6xl font-bold sm:text-7xl">{word.hanzi}</p>
        <Button variant="ghost" size="sm" onClick={() => onSpeak(word.hanzi)}>
          <Volume2 className="h-6 w-6" />
        </Button>
      </div>
      <p className="mt-3 text-lg text-muted">{word.pinyin}</p>
      {showAnswer && (
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
        </div>
      )}
    </>
  );
}

function SentenceReviewCard({
  item,
  showAnswer,
  onSpeak,
}: {
  item: UserSentenceProgressDto;
  showAnswer: boolean;
  onSpeak: (text: string) => void;
}) {
  const sentence = item.sentence!;
  return (
    <>
      <div className="flex items-center justify-center gap-3">
        <p className="chinese-text text-4xl font-bold sm:text-5xl">{sentence.hanzi}</p>
        <Button variant="ghost" size="sm" onClick={() => onSpeak(sentence.hanzi)}>
          <Volume2 className="h-6 w-6" />
        </Button>
      </div>
      {showAnswer ? (
        <div className="mt-8">
          <p className="text-lg text-muted">{sentence.pinyin}</p>
          <p className="mt-4 text-2xl font-semibold">{sentence.meaningVi}</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Nhớ nghĩa tiếng Việt của câu này</p>
      )}
    </>
  );
}
