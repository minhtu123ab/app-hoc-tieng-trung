'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { useConfirm } from '@/contexts/confirm-context';
import { Card } from '@/components/ui/card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Toolbar } from '@/components/ui/toolbar';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, ErrorRetry, EmptyState } from '@/components/ui/states';
import { AddDeckWordsDialog } from '@/components/decks/add-deck-words-dialog';
import { DeckJsonImportDialog } from '@/components/decks/deck-json-import-dialog';
import { parseWordsOnlyJson } from '@/lib/deck-import';
import type { DeckDto, WordDto } from '@linguaflow/shared';
import { speakChinese } from '@/lib/tts';
import { Volume2, ArrowLeft, Dumbbell, Trash2, Download, Plus, Upload } from 'lucide-react';

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = params.id as string;
  const [flipped, setFlipped] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAddWords, setShowAddWords] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
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

  const importWordsMutation = useMutation({
    mutationFn: async (words: Awaited<ReturnType<typeof parseWordsOnlyJson>>) => {
      await api.post(`/decks/${id}/words`, { words });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      setImportError(null);
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

  const handleImportWords = async (file: File) => {
    setImportError(null);
    try {
      const text = await file.text();
      const words = parseWordsOnlyJson(text);
      await importWordsMutation.mutateAsync(words);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import thất bại';
      setImportError(msg);
    }
  };

  const openJsonHelp = () => {
    setShowAddWords(false);
    setShowImportDialog(true);
  };

  if (isLoading) return <PageSkeleton />;
  if (error || !deck) {
    return <ErrorRetry message="Không tải được bộ từ" onRetry={() => refetch()} />;
  }

  const isEmpty = deck.words.length === 0;

  return (
    <div className="w-full space-y-6">
      <AddDeckWordsDialog
        open={showAddWords}
        onClose={() => setShowAddWords(false)}
        deckId={id}
        onOpenJsonHelp={openJsonHelp}
        onError={setImportError}
      />

      <DeckJsonImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onPickFile={() => fileInputRef.current?.click()}
        mode="add-words"
      />

      <PageHeader
        title={deck.title}
        description={`${deck.topic} · ${deck.hskLevel} · ${deck.words.length} từ`}
        action={
          <ButtonLink href="/decks" variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Danh sách
          </ButtonLink>
        }
      />

      <Toolbar>
        <ButtonLink href={`/practice?deckId=${id}`}>
          <Dumbbell className="h-4 w-4" />
          Luyện deck này
        </ButtonLink>
        <Button variant="outline" onClick={() => setShowAddWords(true)}>
          <Plus className="h-4 w-4" />
          Thêm từ
        </Button>
        <Button variant="outline" onClick={() => setShowImportDialog(true)}>
          <Upload className="h-4 w-4" />
          Import thêm
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await handleImportWords(file);
            e.target.value = '';
          }}
        />
        <Button variant="outline" onClick={exportDeck}>
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setTitle(deck.title);
            setTopic(deck.topic);
            setEditing(!editing);
          }}
        >
          Đổi tên
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            const ok = await confirm({
              title: 'Xóa bộ từ',
              message: 'Xóa bộ từ này? Hành động không thể hoàn tác.',
              confirmLabel: 'Xóa',
              variant: 'destructive',
            });
            if (ok) deleteMutation.mutate();
          }}
        >
          <Trash2 className="h-4 w-4" />
          Xóa deck
        </Button>
      </Toolbar>

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

      {editing && (
        <Card className="max-w-md space-y-2 p-4">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Button onClick={() => updateMutation.mutate()}>Lưu</Button>
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          title="Bộ từ chưa có từ nào"
          description="Bấm «Thêm từ» để nhập thủ công, hoặc «Import thêm» / Export từ bộ khác."
          action={
            <Button onClick={() => setShowAddWords(true)}>
              <Plus className="h-4 w-4" />
              Thêm từ đầu tiên
            </Button>
          }
        />
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
