'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, toSelectOptions } from '@/components/ui/select';
import { HSK_LEVEL_OPTIONS } from '@/lib/select-options';
import { Card, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { HskLevel, TOPICS } from '@linguaflow/shared';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type GenerateTab = 'words' | 'sentences';

export default function GeneratePage() {
  const [tab, setTab] = useState<GenerateTab>('words');
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>(HskLevel.HSK1);
  const [count, setCount] = useState(20);
  const [sentenceCount, setSentenceCount] = useState(15);
  const router = useRouter();

  const vocabMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/ai/generate-vocab', {
        topic: customTopic || topic,
        hskLevel,
        count,
      });
      return data;
    },
    onSuccess: (data) => {
      router.push(`/decks/${data.id}`);
    },
  });

  const sentenceMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/ai/generate-sentences', {
        topic: customTopic || topic,
        hskLevel,
        count: sentenceCount,
      });
      return data;
    },
    onSuccess: (data) => {
      router.push(`/sentence-decks/${data.id}`);
    },
  });

  const activeMutation = tab === 'words' ? vocabMutation : sentenceMutation;

  const errorMessage = activeMutation.isError
    ? axios.isAxiosError(activeMutation.error)
      ? (activeMutation.error.response?.data as { message?: string })?.message ??
        activeMutation.error.message
      : tab === 'words'
        ? 'Không thể sinh từ vựng. Vui lòng thử lại.'
        : 'Không thể sinh câu. Vui lòng thử lại.'
    : '';

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader
        title="Sinh nội dung bằng AI"
        description="Gemini tạo bộ từ vựng hoặc bộ câu giao tiếp theo chủ đề và HSK"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('words')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'words'
              ? 'border-primary bg-red-50 text-primary'
              : 'border-border hover:bg-slate-50',
          )}
        >
          Từ vựng
        </button>
        <button
          type="button"
          onClick={() => setTab('sentences')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            tab === 'sentences'
              ? 'border-primary bg-red-50 text-primary'
              : 'border-border hover:bg-slate-50',
          )}
        >
          Câu / hội thoại
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <Card className="lg:col-span-5 xl:col-span-4">
          <CardTitle>
            {tab === 'words' ? 'Sinh từ vựng' : 'Sinh bộ câu'}
          </CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm">Chủ đề</label>
              <Select
                value={topic}
                onChange={setTopic}
                options={toSelectOptions([...TOPICS])}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Hoặc chủ đề tùy chỉnh</label>
              <Input
                placeholder="Ví dụ: Du lịch Đài Loan"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Trình độ HSK</label>
              <Select
                value={hskLevel}
                onChange={(v) => setHskLevel(v as HskLevel)}
                options={HSK_LEVEL_OPTIONS}
              />
            </div>
            {tab === 'words' ? (
              <div>
                <label className="mb-1 block text-sm">Số lượng từ ({count})</label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm">
                  Số câu ({sentenceCount})
                </label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={sentenceCount}
                  onChange={(e) => setSentenceCount(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            {activeMutation.isError && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <Button
              onClick={() =>
                tab === 'words'
                  ? vocabMutation.mutate()
                  : sentenceMutation.mutate()
              }
              disabled={activeMutation.isPending}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {activeMutation.isPending
                ? 'Đang sinh...'
                : tab === 'words'
                  ? `Sinh ${count} từ`
                  : `Sinh ${sentenceCount} câu`}
            </Button>
          </div>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-red-50/80 via-white to-amber-50/50 lg:col-span-7 xl:col-span-8">
          <CardTitle>
            {tab === 'words' ? 'Mẹo sinh từ' : 'Mẹo sinh câu'}
          </CardTitle>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            {tab === 'words' ? (
              <>
                <li>
                  Chọn <strong>chủ đề cụ thể</strong> để AI cho từ vựng sát thực tế hơn.
                </li>
                <li>Bắt đầu với 20–30 từ mỗi lần.</li>
                <li>Sau khi sinh, từ được tự động thêm vào SRS và luyện tập.</li>
              </>
            ) : (
              <>
                <li>
                  Bộ câu dùng cho chế độ <strong>Ghép câu</strong>,{' '}
                  <strong>Sắp câu</strong>, <strong>Nghe & gõ</strong>,{' '}
                  <strong>Điền từ</strong>.
                </li>
                <li>AI tách sẵn <strong>tokens</strong> để ghép câu chuẩn Duolingo.</li>
                <li>Chọn chủ đề giao tiếp: đặt phòng, mua sắm, giới thiệu bản thân...</li>
              </>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
