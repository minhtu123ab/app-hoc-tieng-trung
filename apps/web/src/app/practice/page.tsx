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

const modes = [
  {
    mode: PracticeMode.VIET_TO_HAN,
    title: 'Việt → Hán',
    desc: 'Nhìn nghĩa tiếng Việt, gõ chữ Hán',
  },
  {
    mode: PracticeMode.HAN_TO_VIET,
    title: 'Hán → Việt',
    desc: 'Nhìn chữ Hán, chọn/nhập nghĩa tiếng Việt',
  },
  {
    mode: PracticeMode.LISTEN_TYPE,
    title: 'Nghe và gõ',
    desc: 'Nghe phát âm, gõ chữ Hán',
  },
  {
    mode: PracticeMode.FILL_BLANK,
    title: 'Điền từ',
    desc: 'Điền từ còn thiếu vào câu',
  },
  {
    mode: PracticeMode.SENTENCE_ORDER,
    title: 'Sắp xếp câu',
    desc: 'Sắp xếp các từ thành câu đúng',
  },
  {
    mode: PracticeMode.AI_CONVERSATION,
    title: 'Hội thoại AI',
    desc: 'Luyện giao tiếp với AI (text)',
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

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start xl:gap-8">
        <Card className="lg:col-span-4 xl:col-span-3">
          <CardTitle>Số từ mỗi phiên</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Chọn nhanh hoặc nhập số tùy ý (tối đa 500, giới hạn bởi số từ bạn đang học)
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRACTICE_LIMIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateCount(preset)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  wordCount === preset
                    ? 'border-primary bg-red-50 font-medium text-primary'
                    : 'border-border hover:bg-slate-50'
                }`}
              >
                {preset} từ
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm whitespace-nowrap">Tùy chỉnh:</label>
            <Input
              type="number"
              min={1}
              max={500}
              value={wordCount}
              onChange={(e) => updateCount(clampPracticeLimit(Number(e.target.value)))}
              className="w-28"
            />
            <span className="text-sm text-muted">từ / phiên</span>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-2 xl:col-span-9 xl:grid-cols-3">
          {modes.map(({ mode, title, desc }) => (
            <Link key={mode} href={`/practice/${mode}?limit=${wordCount}`}>
              <Card className="flex h-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardTitle>{title}</CardTitle>
                <p className="mt-2 flex-1 text-sm text-muted">{desc}</p>
                <p className="mt-4 text-xs font-medium text-primary">{wordCount} từ / phiên</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
