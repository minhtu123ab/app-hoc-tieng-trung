'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, ErrorRetry } from '@/components/ui/states';
import type { DeckDto, WordDto } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2, ArrowLeft, Dumbbell, Trash2, Download } from 'lucide-react';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [flipped, setFlipped] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const { data: deck, isLoading, error, refetch } = useQuery<DeckDto & { words: WordDto[] }>({
    queryKey: ['deck', id],
    queryFn: async () => {
      const { data } = await api.get(`/decks/${id}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      router.push('/decks');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/decks/${id}`, { title, topic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      setEditing(false);
    },
  });

  const exportDeck = async () => {
    const { data } = await api.get(`/decks/${id}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck?.title ?? 'deck'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !deck) {
    return <ErrorRetry message="Không tải được bộ từ" onRetry={() => refetch()} />;
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={deck.title}
        description={`${deck.topic} · ${deck.hskLevel} · ${deck.words.length} từ`}
        action={
          <Link href="/decks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Danh sách
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link href={`/practice?deckId=${id}`}>
          <Button>
            <Dumbbell className="mr-2 h-4 w-4" />
            Luyện deck này
          </Button>
        </Link>
        <Button variant="outline" onClick={exportDeck}>
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button variant="outline" onClick={() => {
          setTitle(deck.title);
          setTopic(deck.topic);
          setEditing(!editing);
        }}>
          Đổi tên
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Xóa bộ từ này? Không hoàn tác.')) deleteMutation.mutate();
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa deck
        </Button>
      </div>

      {editing && (
        <Card className="max-w-md space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Button onClick={() => updateMutation.mutate()}>Lưu</Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
