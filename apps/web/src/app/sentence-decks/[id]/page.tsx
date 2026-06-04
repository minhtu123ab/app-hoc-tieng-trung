'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { useConfirm } from '@/contexts/confirm-context';
import { Card } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Toolbar } from '@/components/ui/toolbar';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, ErrorRetry, EmptyState } from '@/components/ui/states';
import type { SentenceDeckDto, SentenceDto } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2, ArrowLeft, Dumbbell, Trash2 } from 'lucide-react';

export default function SentenceDeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const id = params.id as string;
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: deck, isLoading, error, refetch } = useQuery<
    SentenceDeckDto & { sentences: SentenceDto[] }
  >({
    queryKey: ['sentence-deck', id],
    queryFn: async () => {
      const { data } = await api.get(`/sentence-decks/${id}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/sentence-decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentence-decks'] });
      router.push('/sentence-decks');
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error || !deck) {
    return <ErrorRetry message="Không tải được bộ câu" onRetry={() => refetch()} />;
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title={deck.title}
        description={`${deck.topic} · ${deck.hskLevel} · ${deck.sentences.length} câu`}
        action={
          <ButtonLink href="/sentence-decks" variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Danh sách
          </ButtonLink>
        }
      />

      <Toolbar>
        <ButtonLink href={`/practice?source=sentences&sentenceDeckId=${id}`}>
          <Dumbbell className="h-4 w-4" />
          Luyện bộ câu này
        </ButtonLink>
        <Button
          variant="destructive"
          onClick={async () => {
            const ok = await confirm({
              title: 'Xóa bộ câu',
              message: 'Xóa bộ câu này? Hành động không thể hoàn tác.',
              confirmLabel: 'Xóa',
              variant: 'destructive',
            });
            if (ok) deleteMutation.mutate();
          }}
        >
          <Trash2 className="h-4 w-4" />
          Xóa bộ câu
        </Button>
      </Toolbar>

      {deck.sentences.length === 0 ? (
        <EmptyState title="Bộ câu trống" description="Sinh câu mới bằng AI" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deck.sentences.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <p className="chinese-text text-xl font-bold">{s.hanzi}</p>
              <p className="mt-1 text-sm text-muted">{s.pinyin}</p>
              {expanded === s.id && (
                <p className="mt-3 text-base text-foreground">{s.meaningVi}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {s.tokens.join(' · ')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese(s.hanzi);
                  }}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
