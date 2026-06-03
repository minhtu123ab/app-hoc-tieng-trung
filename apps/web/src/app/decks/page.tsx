'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import type { DeckDto } from '@linguaflow/shared';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';

export default function DecksPage() {
  const { data: decks, isLoading } = useQuery<DeckDto[]>({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await api.get('/decks');
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-muted">Đang tải...</div>;
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Bộ từ vựng"
        description="Quản lý các bộ từ đã tạo hoặc sinh bằng AI"
        action={
          <Link
            href="/generate"
            className="inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            + Sinh từ AI
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {decks?.map((deck) => (
          <Link key={deck.id} href={`/decks/${deck.id}`}>
            <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <CardTitle>{deck.title}</CardTitle>
              <p className="mt-2 text-sm text-muted">
                {deck.topic} · {deck.hskLevel}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{deck.wordCount ?? 0} từ</span>
                <span>{deck.source === 'AI' ? 'AI' : 'Thủ công'}</span>
                <span>{formatDate(deck.createdAt)}</span>
              </div>
            </Card>
          </Link>
        ))}
        {!decks?.length && (
          <Card className="col-span-full text-center text-muted">
            Chưa có bộ từ nào. Hãy sinh từ vựng bằng AI!
          </Card>
        )}
      </div>
    </div>
  );
}
