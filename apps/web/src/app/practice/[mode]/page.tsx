'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PracticeQuestion, PracticeMode } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePracticeLimitParam } from '@/lib/practice-limit';

export default function PracticeModePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = params.mode as PracticeMode;
  const limit = parsePracticeLimitParam(searchParams.get('limit'));

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState('');
  const [tokens, setTokens] = useState<string[]>([]);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [score, setScore] = useState({ total: 0, correct: 0 });

  const { data: questions, isLoading } = useQuery<PracticeQuestion[]>({
    queryKey: ['practice', mode, limit],
    queryFn: async () => {
      const { data } = await api.get(`/practice/${mode}?limit=${limit}`);
      return data;
    },
  });

  useEffect(() => {
    if (mode === 'AI_CONVERSATION') {
      router.replace('/tutor');
    }
  }, [mode, router]);

  useEffect(() => {
    setAnswer('');
    setSelected('');
    setResult(null);
    if (questions?.[index]?.tokens) {
      setTokens([]);
    }
  }, [index, questions]);

  if (mode === 'AI_CONVERSATION') return null;

  if (isLoading) return <div className="text-muted">Đang tải...</div>;
  if (!questions?.length) {
    return (
      <Card className="max-w-md">
        <CardTitle>Chưa có từ để luyện</CardTitle>
        <p className="mt-2 text-sm text-muted">
          Hãy thêm bộ từ hoặc sinh từ vựng bằng AI trước.
        </p>
      </Card>
    );
  }

  const q = questions[index];

  const playAudio = () => {
    if (mode === 'LISTEN_TYPE') {
      speakChinese(q.answer);
    } else {
      speakChinese(q.prompt.replace('___', q.answer));
    }
  };

  const submit = async () => {
    let userAnswer = answer;
    if (mode === 'HAN_TO_VIET') userAnswer = selected || answer;
    if (mode === 'SENTENCE_ORDER') userAnswer = tokens.join('');

    const { data } = await api.post('/practice/grade', {
      mode,
      wordId: q.wordId,
      userAnswer,
      correctAnswer: q.answer,
    });

    setResult(data);
    setScore({
      total: score.total + 1,
      correct: score.correct + (data.isCorrect ? 1 : 0),
    });
  };

  const next = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex justify-between text-sm text-muted">
        <span>
          Câu {index + 1}/{questions.length}
        </span>
        <span>
          Điểm: {score.correct}/{score.total} · {limit} từ/phiên
        </span>
      </div>

      <Card>
        {mode === 'LISTEN_TYPE' ? (
          <div className="text-center">
            <p className="text-muted">Nghe và gõ chữ Hán</p>
            <Button className="mt-4" onClick={playAudio}>
              <Volume2 className="mr-2 h-4 w-4" />
              Phát âm
            </Button>
          </div>
        ) : mode === 'SENTENCE_ORDER' ? (
          <div>
            <p className="text-sm text-muted">{q.prompt}</p>
            <p className="chinese-text mt-4 min-h-[48px] rounded-lg bg-slate-50 p-3 text-lg">
              {tokens.join('') || '...'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {q.tokens?.map((token, i) => (
                <Button
                  key={`${token}-${i}`}
                  variant="outline"
                  size="sm"
                  disabled={tokens.includes(token)}
                  onClick={() => setTokens([...tokens, token])}
                  className="chinese-text"
                >
                  {token}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setTokens([])}>
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
            placeholder="Nhập câu trả lời..."
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        ) : null}

        {result && (
          <div
            className={cn(
              'mt-4 rounded-lg p-4 text-center',
              result.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
            )}
          >
            {result.isCorrect ? 'Chính xác!' : `Sai. Đáp án: ${result.correctAnswer}`}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          {!result ? (
            <Button className="flex-1" onClick={submit}>
              Kiểm tra
            </Button>
          ) : (
            <Button className="flex-1" onClick={next}>
              {index < questions.length - 1 ? 'Câu tiếp' : 'Hoàn thành'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
