'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { HskLevel, TOPICS } from '@linguaflow/shared';
import { Sparkles } from 'lucide-react';

export default function GeneratePage() {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>(HskLevel.HSK1);
  const [count, setCount] = useState(20);
  const router = useRouter();

  const mutation = useMutation({
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

  const errorMessage = mutation.isError
    ? axios.isAxiosError(mutation.error)
      ? (mutation.error.response?.data as { message?: string })?.message ??
        mutation.error.message
      : 'Không thể sinh từ vựng. Vui lòng thử lại.'
    : '';

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader
        title="Sinh từ vựng bằng AI"
        description="Gemini sẽ tạo bộ từ vựng theo chủ đề và trình độ HSK của bạn"
      />

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <Card className="lg:col-span-5 xl:col-span-4">
          <CardTitle>Cấu hình</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm">Chủ đề</label>
              <select
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
              <select
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                value={hskLevel}
                onChange={(e) => setHskLevel(e.target.value as HskLevel)}
              >
                {Object.values(HskLevel).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
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
            {mutation.isError && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? 'Đang sinh từ vựng...' : `Sinh ${count} từ`}
            </Button>
          </div>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-red-50/80 via-white to-amber-50/50 lg:col-span-7 xl:col-span-8">
          <CardTitle>Mẹo sinh từ hiệu quả</CardTitle>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
            <li>
              Chọn <strong>chủ đề cụ thể</strong> (vd. &quot;Đặt phòng khách sạn&quot;) thay vì chủ đề
              quá rộng — AI sẽ cho từ vựng sát thực tế hơn.
            </li>
            <li>
              Bắt đầu với <strong>20–30 từ</strong> mỗi lần; học xong rồi sinh thêm để tránh quá tải.
            </li>
            <li>
              Khớp <strong>trình độ HSK</strong> với năng lực hiện tại — từ khó quá sẽ khó nhớ trong SRS.
            </li>
            <li>
              Sau khi sinh, từ được <strong>tự động thêm</strong> vào tiến trình luyện tập và ôn SRS.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
