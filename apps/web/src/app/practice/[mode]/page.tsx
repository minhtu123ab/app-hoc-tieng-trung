'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PracticeQuestion, PracticeMode } from '@linguaflow/shared';
import { speakChinese, maybeAutoPlayListen } from '@/lib/tts';
import { startChineseSpeechRecognition } from '@/lib/stt';
import { Volume2, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePracticeLimitParam } from '@/lib/practice-limit';
import { PageSkeleton } from '@/components/ui/states';

export default function PracticeModePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mode = params.mode as PracticeMode;
  const limit = parsePracticeLimitParam(searchParams.get('limit'));
  const deckId = searchParams.get('deckId') ?? undefined;

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState('');
  const [pickedTokenIndexes, setPickedTokenIndexes] = useState<number[]>([]);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [score, setScore] = useState({ total: 0, correct: 0 });
  const [finished, setFinished] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState<string | null>(null);

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
    if (q && mode === 'LISTEN_TYPE') {
      maybeAutoPlayListen(q.answer, mode);
    }
  }, [index, q, mode]);

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
      if (pos >= 0) {
        return prev.filter((_, i) => i !== pos);
      }
      return [...prev, tokenIndex];
    });
  };

  if (isLoading) return <PageSkeleton />;
  if (error) {
    return (
      <Card className="max-w-md">
        <CardTitle>Lỗi tải câu hỏi</CardTitle>
        <Button className="mt-4" onClick={() => refetch()}>
          Thử lại
        </Button>
      </Card>
    );
  }
  if (!questions?.length) {
    return (
      <Card className="max-w-md">
        <CardTitle>Chưa có từ để luyện</CardTitle>
        <p className="mt-2 text-sm text-muted">
          Hãy thêm bộ từ hoặc sinh từ vựng bằng AI trước.
        </p>
        <Link href="/generate" className="mt-4 inline-block">
          <Button>Sinh từ AI</Button>
        </Link>
      </Card>
    );
  }

  if (finished) {
    const pct =
      score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return (
      <div className="mx-auto max-w-lg text-center">
        <Card className="px-6 py-10">
          <CardTitle className="text-2xl">Hoàn thành phiên luyện!</CardTitle>
          <p className="mt-4 text-4xl font-bold text-primary">
            {score.correct}/{score.total}
          </p>
          <p className="mt-1 text-muted">Độ chính xác: {pct}%</p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                setFinished(false);
                setIndex(0);
                setScore({ total: 0, correct: 0 });
                refetch();
              }}
            >
              Luyện lại
            </Button>
            <Link href="/practice">
              <Button variant="outline" className="w-full">
                Về trang luyện tập
              </Button>
            </Link>
            <Link href="/review">
              <Button variant="outline" className="w-full">
                Ôn SRS
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!q) return null;

  const playAudio = () => {
    if (mode === 'LISTEN_TYPE') {
      speakChinese(q.answer);
    } else {
      speakChinese(q.prompt.replace('___', q.answer));
    }
  };

  const sentenceBuilt =
    mode === 'SENTENCE_ORDER' && q.tokens
      ? pickedTokenIndexes.map((i) => q.tokens![i]).join('')
      : '';

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex justify-between text-sm text-muted">
        <span>
          Câu {index + 1}/{questions.length}
        </span>
        <span>
          Điểm: {score.correct}/{score.total}
        </span>
      </div>

      <Card>
        {mode === 'LISTEN_TYPE' ? (
          <div className="text-center">
            <p className="text-muted">Nghe và gõ chữ Hán</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={playAudio}>
                <Volume2 className="mr-2 h-4 w-4" />
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
                <Mic className="mr-2 h-4 w-4" />
                Nói
              </Button>
            </div>
          </div>
        ) : mode === 'AI_CONVERSATION' ? (
          <div>
            <p className="text-sm leading-relaxed text-muted">{q.prompt}</p>
            {q.hint && (
              <p className="chinese-text mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                {q.hint}
              </p>
            )}
          </div>
        ) : mode === 'SENTENCE_ORDER' ? (
          <div>
            <p className="text-sm text-muted">{q.prompt}</p>
            <p className="chinese-text mt-4 min-h-[48px] rounded-lg bg-slate-50 p-3 text-lg">
              {sentenceBuilt || '...'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {q.tokens?.map((token, i) => {
                const used = pickedTokenIndexes.includes(i);
                return (
                  <Button
                    key={`${token}-${i}`}
                    variant={used ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleToken(i)}
                    className="chinese-text"
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
          </div>
        ) : (
          <div>
            <p
              className={cn(
                'text-2xl font-bold',
                q.prompt.includes('___') || /[\u4e00-\u9fff]/.test(q.prompt)
                  ? 'chinese-text'
                  : '',
              )}
            >
              {q.prompt}
            </p>
            {q.hint && <p className="mt-1 text-sm text-muted">{q.hint}</p>}
            <Button variant="ghost" size="sm" className="mt-2" onClick={playAudio}>
              <Volume2 className="mr-1 h-4 w-4" /> Nghe
            </Button>
          </div>
        )}

        {!result && mode === 'HAN_TO_VIET' && q.options ? (
          <div className="mt-4 grid gap-2">
            {q.options.map((opt) => (
              <Button
                key={opt}
                variant={selected === opt ? 'default' : 'outline'}
                onClick={() => setSelected(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        ) : !result ? (
          <Input
            className="chinese-text mt-4 text-lg"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={
              mode === 'AI_CONVERSATION'
                ? 'Trả lời bằng tiếng Trung...'
                : 'Nhập câu trả lời...'
            }
            onKeyDown={(e) => e.key === 'Enter' && !grading && submit()}
          />
        ) : null}

        {gradeError && (
          <p className="mt-3 text-center text-sm text-red-600">{gradeError}</p>
        )}

        {result && (
          <div
            className={cn(
              'mt-4 rounded-lg p-4 text-center',
              result.isCorrect
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700',
            )}
          >
            {result.isCorrect ? 'Chính xác!' : `Sai. Đáp án: ${result.correctAnswer}`}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {!result ? (
            <Button className="flex-1" onClick={submit} disabled={grading}>
              {grading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang chấm...
                </>
              ) : (
                'Kiểm tra'
              )}
            </Button>
          ) : (
            <Button className="flex-1" onClick={next}>
              {index < questions.length - 1 ? 'Câu tiếp' : 'Hoàn thành'}
            </Button>
          )}
          {!result && (
            <Button variant="ghost" onClick={() => router.push('/practice')}>
              Thoát
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
