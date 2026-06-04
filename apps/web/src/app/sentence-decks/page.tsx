'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Toolbar } from '@/components/ui/toolbar';
import { HSK_FILTER_OPTIONS } from '@/lib/select-options';
import type { SentenceDeckDto } from '@linguaflow/shared';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, EmptyState } from '@/components/ui/states';
import { Sparkles, Dumbbell } from 'lucide-react';

export default function SentenceDecksPage() {
  const [search, setSearch] = useState('');
  const [hskFilter, setHskFilter] = useState('');

  const { data: decks, isLoading, error, refetch } = useQuery<SentenceDeckDto[]>({
    queryKey: ['sentence-decks'],
    queryFn: async () => {
      const { data } = await api.get('/sentence-decks');
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!decks) return [];
    return decks.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.topic.toLowerCase().includes(q);
      const matchHsk = !hskFilter || d.hskLevel === hskFilter;
      return matchSearch && matchHsk;
    });
  }, [decks, search, hskFilter]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Bộ câu"
        description="Các câu giao tiếp sinh bằng AI — dùng cho ghép câu, sắp câu, nghe"
        action={
          <Toolbar>
            <ButtonLink href="/generate">
              <Sparkles className="h-4 w-4" />
              Sinh câu AI
            </ButtonLink>
            <ButtonLink href="/decks" variant="outline">
              Bộ từ vựng
            </ButtonLink>
          </Toolbar>
        }
      />

      <Toolbar>
        <Input
          placeholder="Tìm theo tên, chủ đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-48 flex-1 sm:max-w-xs"
        />
        <Select
          className="w-full sm:w-36"
          value={hskFilter}
          onChange={setHskFilter}
          options={HSK_FILTER_OPTIONS}
        />
      </Toolbar>

      {error && (
        <button type="button" className="text-sm text-primary underline" onClick={() => refetch()}>
          Thử lại
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((deck) => (
          <Link key={deck.id} href={`/sentence-decks/${deck.id}`} className="block">
            <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <CardTitle>{deck.title}</CardTitle>
              <p className="mt-2 text-sm text-muted">
                {deck.topic} · {deck.hskLevel}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{deck.wordCount ?? 0} câu</span>
                <span>{deck.source === 'AI' ? 'AI' : 'Thủ công'}</span>
                <span>{formatDate(deck.createdAt)}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!filtered.length && (
        <EmptyState
          title="Chưa có bộ câu"
          description="Sinh câu giao tiếp bằng AI để luyện ghép câu và nghe"
          action={
            <ButtonLink href="/generate">
              <Sparkles className="h-4 w-4" />
              Sinh câu AI
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
