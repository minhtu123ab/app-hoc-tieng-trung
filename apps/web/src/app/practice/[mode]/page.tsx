'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import {
  PracticeMode,
  PRACTICE_MODE_LABELS,
  type PracticeQuestion,
} from '@linguaflow/shared';
import { speakChinese, maybeAutoPlayListen } from '@/lib/tts';
import { getPracticeSpeechText } from '@/lib/practice-speech';
import { startChineseSpeechRecognition } from '@/lib/stt';
import { parsePracticeLimitParam } from '@/lib/practice-limit';
import { PRACTICE_MODE_DESC, PRACTICE_MODE_TIPS } from '@/lib/practice-mode-meta';
import {
  Volume2,
  Mic,
  Loader2,
  ArrowLeft,
  Lightbulb,
  Target,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageSkeleton } from '@/components/ui/states';

function PracticeSidebar({
  mode,
  index,
  total,
  score,
  limit,
}: {
  mode: PracticeMode;
  index: number;
  total: number;
  score: { correct: number; total: number };
  limit: number;
}) {
  const progress = total > 0 ? ((index + 1) / total) * 100 : 0;
  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <aside className="space-y-4 lg:col-span-4">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Phiên luyện
        </CardTitle>
        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Tiến độ</span>
              <span>
                {index + 1}/{total}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/80 p-3 text-center">
              <p className="text-2xl font-bold text-primary">
                {score.correct}/{score.total}
              </p>
              <p className="text-xs text-muted">Đúng / đã chấm</p>
            </div>
            <div className="rounded-xl bg-white/80 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {score.total > 0 ? `${accuracy}%` : '—'}
              </p>
              <p className="text-xs text-muted">Độ chính xác</p>
            </div>
          </div>
          <p className="text-xs text-muted">Mục tiêu phiên: {limit} câu</p>
        </div>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Mẹo chế độ
        </CardTitle>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          {PRACTICE_MODE_TIPS[mode].map((tip) => (
            <li key={tip} className="rounded-lg bg-slate-50 px-3 py-2 text-foreground">
              {tip}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <Keyboard className="h-5 w-5 text-muted" />
          Phím tắt
        </CardTitle>
        <p className="mt-2 text-sm text-muted">
          <strong className="text-foreground">Enter</strong> — kiểm tra / câu tiếp
        </p>
      </Card>
    </aside>
  );
}

export default function PracticeModePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mode = params.mode as PracticeMode;
  const limit = parsePracticeLimitParam(searchParams.get('limit'));
  const deckId = searchParams.get('deckId') ?? undefined;
  const modeLabel = PRACTICE_MODE_LABELS[mode] ?? mode;
  const modeDesc = PRACTICE_MODE_DESC[mode];

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState('');
  const [pickedTokenIndexes, setPickedTokenIndexes] = useState<number[]>([]);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(
    null,
  );
  const [score, setScore] = useState({ total: 0, correct: 0 });
  const [finished, setFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const autoPlayedIndexRef = useRef<number | null>(null);

  const queryKey = ['practice', mode, limit, deckId] as const;

  const { data: questions, isLoading, error, refetch } = useQuery<PracticeQuestion[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (deckId) params.set('deckId', deckId);
      const { data } = await api.get(`/practice/${mode}?${params}`);
      return data;
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/practice/session/start', { mode });
        if (!cancelled) setSessionId(data.id);
      } catch {
        /* session optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const q = questions?.[index];

  useEffect(() => {
    setAnswer('');
    setSelected('');
    setResult(null);
    setGradeError(null);
    setPickedTokenIndexes([]);
  }, [index]);

  useEffect(() => {
    if (mode !== 'LISTEN_TYPE' || !questions?.[index]) return;
    if (autoPlayedIndexRef.current === index) return;
    autoPlayedIndexRef.current = index;
    const text = getPracticeSpeechText(mode, questions[index]);
    maybeAutoPlayListen(text, mode);
  }, [index, mode, questions]);

  const finishSession = useCallback(async () => {
    if (sessionId && score.total > 0) {
      try {
        await api.post(`/practice/session/${sessionId}/end`, {
          total: score.total,
          correct: score.correct,
        });
      } catch {
        /* ignore */
      }
    }
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['srs-due'] });
    setFinished(true);
  }, [sessionId, score, queryClient]);

  const submit = async () => {
    if (!q || grading) return;
    let userAnswer = answer;
    if (mode === 'HAN_TO_VIET') userAnswer = selected || answer;
    if (mode === 'SENTENCE_ORDER' && q.tokens) {
      userAnswer = pickedTokenIndexes.map((i) => q.tokens![i]).join('');
    }

    setGrading(true);
    setGradeError(null);
    try {
      const { data } = await api.post('/practice/grade', {
        mode,
        wordId: q.wordId,
        userAnswer,
        correctAnswer: q.answer,
      });
      setResult(data);
      setScore((s) => ({
        total: s.total + 1,
        correct: s.correct + (data.isCorrect ? 1 : 0),
      }));
    } catch {
      setGradeError('Không chấm được câu trả lời. Thử lại.');
    } finally {
      setGrading(false);
    }
  };

  const next = async () => {
    if (index < (questions?.length ?? 1) - 1) {
      setIndex(index + 1);
    } else {
      await finishSession();
    }
  };

  const toggleToken = (tokenIndex: number) => {
    setPickedTokenIndexes((prev) => {
      const pos = prev.indexOf(tokenIndex);
      if (pos >= 0) return prev.filter((_, i) => i !== pos);
      return [...prev, tokenIndex];
    });
  };

  const backHref = deckId ? `/practice?deckId=${deckId}` : '/practice';

  if (isLoading) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={modeLabel} description={modeDesc} />
        <PageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={modeLabel} description={modeDesc} />
        <Card className="max-w-lg">
          <CardTitle>Lỗi tải câu hỏi</CardTitle>
          <Button className="mt-4" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={modeLabel} description={modeDesc} />
        <Card className="max-w-lg">
          <CardTitle>Chưa có từ để luyện</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Hãy thêm bộ từ hoặc sinh từ vựng bằng AI trước.
          </p>
          <Link href="/generate" className="mt-4 inline-block">
            <Button>Sinh từ AI</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (finished) {
    const pct =
      score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="w-full space-y-6">
        <PageHeader title={modeLabel} description="Kết quả phiên luyện" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="py-12 text-center lg:col-span-8">
            <CardTitle className="text-2xl">Hoàn thành phiên luyện!</CardTitle>
            <p className="mt-4 text-5xl font-bold text-primary">
              {score.correct}/{score.total}
            </p>
            <p className="mt-2 text-lg text-muted">Độ chính xác: {pct}%</p>
            <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setScore({ total: 0, correct: 0 });
                autoPlayedIndexRef.current = null;
                refetch();
              }}
              >
                Luyện lại
              </Button>
              <ButtonLink href={backHref} variant="outline">
                Về trang luyện tập
              </ButtonLink>
              <ButtonLink href="/review" variant="outline">
                Ôn SRS
              </ButtonLink>
            </div>
          </Card>
          <aside className="lg:col-span-4">
            <Card>
              <CardTitle className="text-base">Tóm tắt</CardTitle>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Chế độ: {modeLabel}</li>
                <li>Số câu: {questions.length}</li>
                <li>Đúng: {score.correct}</li>
                <li>Sai: {score.total - score.correct}</li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const playAudio = () => {
    speakChinese(getPracticeSpeechText(mode, q));
  };

  const sentenceBuilt =
    mode === 'SENTENCE_ORDER' && q.tokens
      ? pickedTokenIndexes.map((i) => q.tokens![i]).join('')
      : '';

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={modeLabel}
        description={modeDesc}
        action={
          <ButtonLink href={backHref} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <div className="space-y-4 lg:col-span-8">
          <div className="flex justify-between text-sm font-medium text-muted lg:hidden">
            <span>
              Câu {index + 1}/{questions.length}
            </span>
            <span>
              Điểm: {score.correct}/{score.total}
            </span>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border/60 bg-gradient-to-br from-slate-50/90 to-primary/5 px-6 py-10 text-center sm:px-10 sm:py-12">
              {mode === 'LISTEN_TYPE' ? (
                <>
                  <p className="text-sm font-medium text-muted">Nghe và gõ chữ Hán</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button onClick={playAudio}>
                      <Volume2 className="h-4 w-4" />
                      Phát âm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        startChineseSpeechRecognition(
                          (text) => setAnswer(text),
                          () => setGradeError('Không dùng được mic'),
                        )
                      }
                    >
                      <Mic className="h-4 w-4" />
                      Nói
                    </Button>
                  </div>
                </>
              ) : mode === 'AI_CONVERSATION' ? (
                <>
                  <p className="mx-auto max-w-3xl text-left text-base leading-relaxed text-muted sm:text-center">
                    {q.prompt}
                  </p>
                  {q.hint && (
                    <p className="chinese-text mx-auto mt-4 max-w-3xl rounded-xl border border-border/60 bg-card-solid p-4 text-left text-lg sm:text-center">
                      {q.hint}
                    </p>
                  )}
                </>
              ) : mode === 'SENTENCE_ORDER' ? (
                <>
                  <p className="text-sm text-muted">{q.prompt}</p>
                  <p className="chinese-text mx-auto mt-6 min-h-[56px] max-w-4xl rounded-xl border border-border/60 bg-card-solid p-4 text-xl sm:text-2xl">
                    {sentenceBuilt || '...'}
                  </p>
                  <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
                    {q.tokens?.map((token, i) => {
                      const used = pickedTokenIndexes.includes(i);
                      return (
                        <Button
                          key={`${token}-${i}`}
                          variant={used ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleToken(i)}
                          className="chinese-text text-base"
                        >
                          {token}
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPickedTokenIndexes([])}
                    >
                      Xóa
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className={cn(
                      'font-bold leading-tight',
                      q.prompt.includes('___') || /[\u4e00-\u9fff]/.test(q.prompt)
                        ? 'chinese-text text-4xl sm:text-5xl md:text-6xl'
                        : 'text-2xl sm:text-4xl',
                    )}
                  >
                    {q.prompt}
                  </p>
                  {q.hint && (
                    <p className="mt-3 text-lg text-muted sm:text-xl">{q.hint}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-5"
                    onClick={playAudio}
                  >
                    <Volume2 className="h-4 w-4" />
                    Nghe
                  </Button>
                </>
              )}
            </div>

            <div className="space-y-4 px-6 py-6 sm:px-10 sm:py-8">
              {!result && mode === 'HAN_TO_VIET' && q.options ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                  {q.options.map((opt) => (
                    <Button
                      key={opt}
                      variant={selected === opt ? 'default' : 'outline'}
                      className="h-auto min-h-11 w-full whitespace-normal py-3 text-left text-base"
                      onClick={() => setSelected(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              ) : null}

              {!result &&
                mode !== 'HAN_TO_VIET' &&
                mode !== 'SENTENCE_ORDER' && (
                  <Input
                    className="chinese-text w-full text-center text-lg sm:text-xl"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={
                      mode === 'AI_CONVERSATION'
                        ? 'Trả lời bằng tiếng Trung...'
                        : 'Nhập câu trả lời...'
                    }
                    onKeyDown={(e) => e.key === 'Enter' && !grading && submit()}
                  />
                )}

              {gradeError && (
                <p className="text-center text-sm text-red-600">{gradeError}</p>
              )}

              {result && (
                <div
                  className={cn(
                    'w-full rounded-xl p-5 text-center text-lg',
                    result.isCorrect
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700',
                  )}
                >
                  {result.isCorrect
                    ? 'Chính xác!'
                    : `Sai. Đáp án: ${result.correctAnswer}`}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                {!result ? (
                  <>
                    <Button className="w-full" onClick={submit} disabled={grading}>
                      {grading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang chấm...
                        </>
                      ) : (
                        'Kiểm tra'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:min-w-[7.5rem]"
                      onClick={() => router.push(backHref)}
                    >
                      Thoát
                    </Button>
                  </>
                ) : (
                  <Button className="w-full sm:col-span-2" onClick={next}>
                    {index < questions.length - 1 ? 'Câu tiếp' : 'Hoàn thành'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <PracticeSidebar
          mode={mode}
          index={index}
          total={questions.length}
          score={score}
          limit={limit}
        />
      </div>
    </div>
  );
}
