'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Toolbar } from '@/components/ui/toolbar';
import {
  DECK_SOURCE_FILTER_OPTIONS,
  HSK_FILTER_OPTIONS,
} from '@/lib/select-options';
import type { DeckDto } from '@linguaflow/shared';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, EmptyState } from '@/components/ui/states';
import { CreateDeckDialog } from '@/components/decks/create-deck-dialog';
import { DeckJsonImportDialog } from '@/components/decks/deck-json-import-dialog';
import { parseDeckImportJson } from '@/lib/deck-import';
import { FolderPlus, Sparkles, Upload } from 'lucide-react';

export default function DecksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [hskFilter, setHskFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { data: decks, isLoading, error, refetch } = useQuery<DeckDto[]>({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await api.get('/decks');
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
      const matchSource = !sourceFilter || d.source === sourceFilter;
      return matchSearch && matchHsk && matchSource;
    });
  }, [decks, search, hskFilter, sourceFilter]);

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const payload = parseDeckImportJson(text);
      const { data } = await api.post<DeckDto & { id: string }>('/decks/import', payload);
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      router.push(`/decks/${data.id}`);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : (e as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? 'Import thất bại';
      setImportError(typeof msg === 'string' ? msg : 'Import thất bại');
    }
  };

  const openJsonHelp = () => {
    setShowCreate(false);
    setShowImportDialog(true);
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="w-full space-y-6">
      <CreateDeckDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(deck) => router.push(`/decks/${deck.id}`)}
        onOpenJsonHelp={openJsonHelp}
      />

      <DeckJsonImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onPickFile={() => fileInputRef.current?.click()}
        mode="new-deck"
      />

      <PageHeader
        title="Bộ từ vựng"
        description="Quản lý các bộ từ đã tạo hoặc sinh bằng AI"
        action={
          <Toolbar>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <FolderPlus className="h-4 w-4" />
              Tạo thủ công
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
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

      {importError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => setShowImportDialog(true)}
          >
            Xem định dạng JSON
          </button>
        </p>
      )}

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
