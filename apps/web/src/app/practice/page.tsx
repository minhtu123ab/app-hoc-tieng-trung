'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { PracticeMode } from '@linguaflow/shared';
import type { DeckDto } from '@linguaflow/shared';
import {
  PRACTICE_LIMIT_PRESETS,
  clampPracticeLimit,
  getStoredPracticeLimit,
  setStoredPracticeLimit,
} from '@/lib/practice-limit';
import {
  Languages,
  Headphones,
  PenLine,
  ListOrdered,
  MessageCircle,
  ArrowLeftRight,
  Puzzle,
  Link2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const modes = [
  {
    mode: PracticeMode.VIET_TO_HAN,
    title: 'Việt → Hán',
    desc: 'Nhìn nghĩa tiếng Việt, gõ chữ Hán',
    icon: ArrowLeftRight,
    color: 'bg-rose-500/10 text-rose-600',
  },
  {
    mode: PracticeMode.HAN_TO_VIET,
    title: 'Hán → Việt',
    desc: 'Nhìn chữ Hán, chọn/nhập nghĩa tiếng Việt',
    icon: Languages,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    mode: PracticeMode.LISTEN_TYPE,
    title: 'Nghe và gõ',
    desc: 'Nghe phát âm, gõ chữ Hán',
    icon: Headphones,
    color: 'bg-violet-500/10 text-violet-600',
  },
  {
    mode: PracticeMode.FILL_BLANK,
    title: 'Điền từ',
    desc: 'Điền từ còn thiếu vào câu',
    icon: PenLine,
    color: 'bg-amber-500/10 text-amber-700',
  },
  {
    mode: PracticeMode.SENTENCE_ORDER,
    title: 'Sắp xếp câu',
    desc: 'Sắp xếp các từ thành câu đúng',
    icon: ListOrdered,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    mode: PracticeMode.WORD_BANK,
    title: 'Ghép câu',
    desc: 'Chọn từ Hán ghép thành câu từ nghĩa Việt',
    icon: Puzzle,
    color: 'bg-cyan-500/10 text-cyan-700',
  },
  {
    mode: PracticeMode.MATCH_PAIRS,
    title: 'Ghép cặp',
    desc: 'Ghép chữ Hán với nghĩa tiếng Việt',
    icon: Link2,
    color: 'bg-indigo-500/10 text-indigo-600',
    wordsOnly: true,
  },
  {
    mode: PracticeMode.AI_CONVERSATION,
    title: 'Hội thoại AI',
    desc: 'Luyện giao tiếp với AI (text)',
    icon: MessageCircle,
    color: 'bg-primary/10 text-primary',
  },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Tất cả từ đang học' },
  { value: 'due', label: 'Chỉ từ đến hạn ôn' },
];

function buildPracticeHref(
  mode: PracticeMode,
  wordCount: number,
  deckId: string | null,
  scope: string,
  source: string,
  sentenceDeckId: string | null,
) {
  const params = new URLSearchParams({ limit: String(wordCount), scope });
  if (source === 'sentences' && sentenceDeckId) {
    params.set('source', 'sentences');
    params.set('sentenceDeckId', sentenceDeckId);
  } else if (deckId) {
    params.set('deckId', deckId);
  }
  return `/practice/${mode}?${params}`;
}

export default function PracticeIndexPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckIdFromUrl = searchParams.get('deckId');
  const [wordCount, setWordCount] = useState(10);
  const [scope, setScope] = useState('all');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(deckIdFromUrl);
  const [source, setSource] = useState<'words' | 'sentences'>('words');
  const [selectedSentenceDeckId, setSelectedSentenceDeckId] = useState<string | null>(null);

  useEffect(() => {
    setWordCount(getStoredPracticeLimit());
  }, []);

  useEffect(() => {
    setSelectedDeckId(deckIdFromUrl);
  }, [deckIdFromUrl]);

  const { data: decks } = useQuery<DeckDto[]>({
    queryKey: ['decks'],
    queryFn: async () => {
      const { data } = await api.get('/decks');
      return data;
    },
  });

  const { data: sentenceDecks } = useQuery<DeckDto[]>({
    queryKey: ['sentence-decks'],
    queryFn: async () => {
      const { data } = await api.get('/sentence-decks');
      return data;
    },
  });

  const { data: activeDeck } = useQuery<DeckDto>({
    queryKey: ['deck', selectedDeckId],
    queryFn: async () => {
      const { data } = await api.get(`/decks/${selectedDeckId}`);
      return data;
    },
    enabled: !!selectedDeckId && source === 'words',
  });

  const { data: activeSentenceDeck } = useQuery<DeckDto>({
    queryKey: ['sentence-deck', selectedSentenceDeckId],
    queryFn: async () => {
      const { data } = await api.get(`/sentence-decks/${selectedSentenceDeckId}`);
      return data;
    },
    enabled: !!selectedSentenceDeckId && source === 'sentences',
  });

  const updateCount = (value: number) => {
    setWordCount(setStoredPracticeLimit(value));
  };

  const deckOptions = [
    { value: '', label: 'Tất cả bộ từ' },
    ...(decks?.map((d) => ({
      value: d.id,
      label: `${d.title} (${d.wordCount ?? 0} từ)`,
    })) ?? []),
  ];

  const sentenceDeckOptions = [
    { value: '', label: 'Tất cả bộ câu' },
    ...(sentenceDecks?.map((d) => ({
      value: d.id,
      label: `${d.title} (${d.wordCount ?? 0} câu)`,
    })) ?? []),
  ];

  const clearDeckFilter = () => {
    setSelectedDeckId(null);
    setSelectedSentenceDeckId(null);
    router.replace('/practice');
  };

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader
        title="Luyện tập"
        description="Chọn phạm vi, chế độ và số câu mỗi phiên"
      />

      {(activeDeck || activeSentenceDeck) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            Đang luyện bộ:{' '}
            <span className="text-primary">
              {activeDeck?.title ?? activeSentenceDeck?.title}
            </span>
            {scope === 'due' && ' · chỉ từ đến hạn'}
          </p>
          <Button variant="ghost" size="sm" onClick={clearDeckFilter}>
            <X className="h-4 w-4" />
            Bỏ chọn bộ
          </Button>
        </div>
      )}

      <Card className="w-full space-y-4">
        <CardTitle>Phạm vi luyện tập</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm text-muted">Nguồn</label>
            <Select
              value={source}
              onChange={(v) => {
                setSource(v as 'words' | 'sentences');
                setSelectedDeckId(null);
                setSelectedSentenceDeckId(null);
              }}
              options={[
                { value: 'words', label: 'Từ vựng' },
                { value: 'sentences', label: 'Câu / hội thoại' },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Lọc</label>
            <Select value={scope} onChange={setScope} options={SCOPE_OPTIONS} />
          </div>
          {source === 'words' ? (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted">Bộ từ</label>
              <Select
                value={selectedDeckId ?? ''}
                onChange={(v) => setSelectedDeckId(v || null)}
                options={deckOptions}
              />
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted">Bộ câu</label>
              <Select
                value={selectedSentenceDeckId ?? ''}
                onChange={(v) => setSelectedSentenceDeckId(v || null)}
                options={sentenceDeckOptions}
              />
            </div>
          )}
        </div>
      </Card>

      <Card className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Số câu mỗi phiên</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Chọn nhanh hoặc nhập số tùy ý (tối đa 500)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {PRACTICE_LIMIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateCount(preset)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                  wordCount === preset
                    ? 'border-primary bg-red-50 text-primary shadow-sm'
                    : 'border-border hover:bg-slate-50',
                )}
              >
                {preset} câu
              </button>
            ))}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-slate-50/80 px-3 py-2">
              <label className="text-sm whitespace-nowrap text-muted">Tùy chỉnh</label>
              <Input
                type="number"
                min={1}
                max={500}
                value={wordCount}
                onChange={(e) => updateCount(clampPracticeLimit(Number(e.target.value)))}
                className="h-8 w-20 border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modes
          .filter((m) => {
            if (source === 'sentences') {
              return [
                PracticeMode.SENTENCE_ORDER,
                PracticeMode.WORD_BANK,
                PracticeMode.LISTEN_TYPE,
                PracticeMode.FILL_BLANK,
              ].includes(m.mode);
            }
            return !('wordsOnly' in m && m.wordsOnly);
          })
          .filter((m) => source === 'words' || m.mode !== PracticeMode.VIET_TO_HAN)
          .filter((m) => source === 'words' || m.mode !== PracticeMode.HAN_TO_VIET)
          .filter((m) => source === 'words' || m.mode !== PracticeMode.AI_CONVERSATION)
          .map(({ mode, title, desc, icon: Icon, color }) => (
          <Link
            key={mode}
            href={buildPracticeHref(
              mode,
              wordCount,
              selectedDeckId,
              scope,
              source,
              selectedSentenceDeckId,
            )}
          >
            <Card className="flex h-full min-h-[10.5rem] flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className={cn('rounded-xl p-3', color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                </div>
              </div>
              <p className="mt-auto pt-5 text-sm font-medium text-primary">
                {wordCount} câu / phiên →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
