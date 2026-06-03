'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DeckDto, HskLevel } from '@linguaflow/shared';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, EmptyState } from '@/components/ui/states';

export default function DecksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hskFilter, setHskFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>('HSK1' as HskLevel);

  const { data: decks, isLoading, error, refetch } = useQuery<DeckDto[]>({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await api.get('/decks');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/decks', { title, topic, hskLevel });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      setShowCreate(false);
      setTitle('');
      setTopic('');
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
      const matchSource = !sourceFilter || d.source === sourceFilter;
      return matchSearch && matchHsk && matchSource;
    });
  }, [decks, search, hskFilter, sourceFilter]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Bộ từ vựng"
        description="Quản lý các bộ từ đã tạo hoặc sinh bằng AI"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowCreate(!showCreate)}>
              + Tạo thủ công
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border px-4 py-2 text-sm hover:bg-slate-50">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  const payload = JSON.parse(text);
                  await api.post('/decks/import', payload);
                  queryClient.invalidateQueries({ queryKey: ['decks'] });
                }}
              />
            </label>
            <Link
              href="/generate"
              className="inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              + Sinh từ AI
            </Link>
          </div>
        }
      />

      {showCreate && (
        <Card className="max-w-md space-y-3">
          <Input placeholder="Tên bộ từ" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Chủ đề" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Input placeholder="HSK (VD: HSK1)" value={hskLevel} onChange={(e) => setHskLevel(e.target.value as HskLevel)} />
          <Button onClick={() => createMutation.mutate()} disabled={!title || !topic}>
            Tạo bộ từ
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Tìm theo tên, chủ đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded-lg border border-border px-3 py-2 text-sm"
          value={hskFilter}
          onChange={(e) => setHskFilter(e.target.value)}
        >
          <option value="">Mọi HSK</option>
          {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'ADVANCED'].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-border px-3 py-2 text-sm"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="">Mọi nguồn</option>
          <option value="AI">AI</option>
          <option value="MANUAL">Thủ công</option>
        </select>
      </div>

      {error && (
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((deck) => (
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
      </div>

      {!filtered.length && (
        <EmptyState
          title="Không có bộ từ phù hợp"
          description={decks?.length ? 'Thử đổi bộ lọc' : 'Hãy sinh từ vựng bằng AI'}
        />
      )}
    </div>
  );
}
