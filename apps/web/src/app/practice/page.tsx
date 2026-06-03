'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { PracticeMode } from '@linguaflow/shared';
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
    mode: PracticeMode.AI_CONVERSATION,
    title: 'Hội thoại AI',
    desc: 'Luyện giao tiếp với AI (text)',
    icon: MessageCircle,
    color: 'bg-primary/10 text-primary',
  },
];

export default function PracticeIndexPage() {
  const [wordCount, setWordCount] = useState(10);

  useEffect(() => {
    setWordCount(getStoredPracticeLimit());
  }, []);

  const updateCount = (value: number) => {
    setWordCount(setStoredPracticeLimit(value));
  };

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader
        title="Luyện tập"
        description="Chọn chế độ và số từ mỗi phiên luyện tập"
      />

      <Card className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Số từ mỗi phiên</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Chọn nhanh hoặc nhập số tùy ý (tối đa 500, giới hạn bởi số từ bạn đang học)
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
                {preset} từ
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
        {modes.map(({ mode, title, desc, icon: Icon, color }) => (
          <Link key={mode} href={`/practice/${mode}?limit=${wordCount}`}>
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
                {wordCount} từ / phiên →
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
