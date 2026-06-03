'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle } from '@/components/ui/card';
import { HskLevel, TOPICS } from '@linguaflow/shared';

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
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Sinh từ vựng bằng AI</h1>
      <p className="mt-1 text-muted">
        Gemini sẽ tạo bộ từ vựng theo chủ đề và trình độ HSK của bạn
      </p>

      <Card className="mt-6">
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
            className="w-full"
          >
            {mutation.isPending ? 'Đang sinh từ vựng...' : `Sinh ${count} từ`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
