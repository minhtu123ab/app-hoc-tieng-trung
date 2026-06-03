'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserWordProgressDto } from '@linguaflow/shared';
import { ReviewRating } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2 } from 'lucide-react';

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
      <Card className="max-w-md text-center">
        <CardTitle>Hoàn thành!</CardTitle>
        <p className="mt-2 text-muted">Không có từ nào cần ôn hôm nay.</p>
      </Card>
    );
  }

  const current = dueWords[index];
  const word = current.word!;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <span>
          Từ {index + 1} / {dueWords.length}
        </span>
        <span>Trạng thái: {current.status}</span>
      </div>

      <Card className="text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="chinese-text text-5xl font-bold">{word.hanzi}</p>
          <Button variant="ghost" size="sm" onClick={() => speakChinese(word.hanzi)}>
            <Volume2 className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-2 text-muted">{word.pinyin}</p>

        {showAnswer ? (
          <div className="mt-6">
            <p className="text-xl font-medium">{word.meaningVi}</p>
            {word.exampleHanzi && (
              <p className="chinese-text mt-3 text-sm">{word.exampleHanzi}</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button
                variant="destructive"
                onClick={() => reviewMutation.mutate(ReviewRating.AGAIN)}
              >
                Quên
              </Button>
              <Button
                variant="outline"
                onClick={() => reviewMutation.mutate(ReviewRating.HARD)}
              >
                Khó
              </Button>
              <Button onClick={() => reviewMutation.mutate(ReviewRating.GOOD)}>
                Đúng
              </Button>
              <Button
                variant="outline"
                onClick={() => reviewMutation.mutate(ReviewRating.EASY)}
              >
                Dễ
              </Button>
            </div>
          </div>
        ) : (
          <Button className="mt-8" onClick={() => setShowAnswer(true)}>
            Hiện đáp án
          </Button>
        )}
      </Card>
    </div>
  );
}
