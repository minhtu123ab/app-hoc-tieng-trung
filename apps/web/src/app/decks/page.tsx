'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Toolbar } from '@/components/ui/toolbar';
import {
  DECK_SOURCE_FILTER_OPTIONS,
  HSK_FILTER_OPTIONS,
  HSK_LEVEL_OPTIONS,
} from '@/lib/select-options';
import type { DeckDto, HskLevel } from '@linguaflow/shared';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, EmptyState } from '@/components/ui/states';
import { FolderPlus, Sparkles, Upload } from 'lucide-react';

export default function DecksPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImport = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text);
    await api.post('/decks/import', payload);
    queryClient.invalidateQueries({ queryKey: ['decks'] });
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Bộ từ vựng"
        description="Quản lý các bộ từ đã tạo hoặc sinh bằng AI"
        action={
          <Toolbar>
            <Button variant="outline" onClick={() => setShowCreate(!showCreate)}>
              <FolderPlus className="h-4 w-4" />
              Tạo thủ công
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) await handleImport(file);
                e.target.value = '';
              }}
            />
            <ButtonLink href="/generate">
              <Sparkles className="h-4 w-4" />
              Sinh từ AI
            </ButtonLink>
          </Toolbar>
        }
      />

      {showCreate && (
        <Card className="max-w-md space-y-3">
          <Input placeholder="Tên bộ từ" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Chủ đề" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Select
            value={hskLevel}
            onChange={(v) => setHskLevel(v as HskLevel)}
            options={HSK_LEVEL_OPTIONS}
          />
          <Button onClick={() => createMutation.mutate()} disabled={!title || !topic}>
            Tạo bộ từ
          </Button>
        </Card>
      )}

      <Toolbar>
        <Input
          placeholder="Tìm theo tên, chủ đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-w-[12rem] flex-1 sm:max-w-xs"
        />
        <Select
          className="w-full sm:w-36"
          value={hskFilter}
          onChange={setHskFilter}
          options={HSK_FILTER_OPTIONS}
        />
        <Select
          className="w-full sm:w-36"
          value={sourceFilter}
          onChange={setSourceFilter}
          options={DECK_SOURCE_FILTER_OPTIONS}
        />
      </Toolbar>

      {error && (
        <Button variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((deck) => (
          <Link key={deck.id} href={`/decks/${deck.id}`} className="block">
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
