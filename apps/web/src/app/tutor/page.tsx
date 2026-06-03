'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export default function TutorPage() {
  const [tab, setTab] = useState<'ask' | 'chat'>('ask');
  const [question, setQuestion] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'teacher' | 'friend' | 'customer' | 'shopkeeper'>('teacher');
  const [askAnswer, setAskAnswer] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: history } = useQuery<Message[]>({
    queryKey: ['tutor-history'],
    queryFn: async () => {
      const { data } = await api.get('/tutor/history');
      return data;
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tutor/ask', { question });
      return data.answer as string;
    },
    onSuccess: (answer) => {
      setAskAnswer(answer);
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['tutor-history'] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tutor/chat', { message, role });
      return data.reply as string;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['tutor-history'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Gia sư AI</h1>
      <p className="mt-1 text-muted">Hỏi ngữ pháp hoặc luyện hội thoại</p>

      <div className="mt-4 flex gap-2">
        <Button
          variant={tab === 'ask' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('ask')}
        >
          Giải thích
        </Button>
        <Button
          variant={tab === 'chat' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('chat')}
        >
          Hội thoại
        </Button>
      </div>

      {tab === 'ask' ? (
        <Card className="mt-4">
          <CardTitle>Hỏi gia sư</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Ví dụ: Khác nhau giữa 会 và 能? Tại sao dùng 被?
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi..."
              onKeyDown={(e) => e.key === 'Enter' && askMutation.mutate()}
            />
            <Button
              onClick={() => askMutation.mutate()}
              disabled={!question || askMutation.isPending}
            >
              Hỏi
            </Button>
          </div>
          {askAnswer && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm whitespace-pre-wrap">
              {askAnswer}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mt-4">
          <div className="mb-4">
            <label className="text-sm">Vai trò AI</label>
            <select
              className="ml-2 rounded border border-border px-2 py-1 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              <option value="teacher">Giáo viên</option>
              <option value="friend">Bạn bè</option>
              <option value="customer">Khách hàng</option>
              <option value="shopkeeper">Người bán hàng</option>
            </select>
          </div>

          <div className="max-h-96 space-y-3 overflow-y-auto">
            {history?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg p-3 text-sm',
                  msg.role === 'USER'
                    ? 'ml-8 bg-red-50'
                    : 'mr-8 bg-slate-50 whitespace-pre-wrap',
                )}
              >
                {msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập tin nhắn tiếng Trung hoặc Việt..."
              onKeyDown={(e) => e.key === 'Enter' && chatMutation.mutate()}
            />
            <Button
              onClick={() => chatMutation.mutate()}
              disabled={!message || chatMutation.isPending}
            >
              Gửi
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
