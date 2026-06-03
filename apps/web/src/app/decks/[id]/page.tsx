'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DeckDto, WordDto } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2 } from 'lucide-react';

export default function DeckDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [flipped, setFlipped] = useState<number | null>(null);

  const { data: deck, isLoading } = useQuery<DeckDto & { words: WordDto[] }>({
    queryKey: ['deck', id],
    queryFn: async () => {
      const { data } = await api.get(`/decks/${id}`);
      return data;
    },
  });

  if (isLoading) return <div className="text-muted">Đang tải...</div>;
  if (!deck) return <div>Không tìm thấy bộ từ</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{deck.title}</h1>
      <p className="mt-1 text-muted">
        {deck.topic} · {deck.hskLevel} · {deck.words.length} từ
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deck.words.map((word, i) => (
          <Card
            key={word.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setFlipped(flipped === i ? null : i)}
          >
            {flipped === i ? (
              <div>
                <p className="text-lg font-medium">{word.meaningVi}</p>
                <p className="mt-1 text-sm text-muted">{word.pinyin}</p>
                {word.exampleHanzi && (
                  <p className="chinese-text mt-3 text-sm">{word.exampleHanzi}</p>
                )}
                {word.exampleVi && (
                  <p className="mt-1 text-xs text-muted">{word.exampleVi}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="chinese-text text-3xl font-bold">{word.hanzi}</p>
                  <p className="mt-1 text-sm text-muted">{word.pinyin}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese(word.hanzi);
                  }}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
