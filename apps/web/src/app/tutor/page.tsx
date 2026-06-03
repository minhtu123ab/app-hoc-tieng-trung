'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TutorMarkdown } from '@/components/tutor/tutor-markdown';
import { PageHeader } from '@/components/layout/page-header';
import { Lightbulb, MessageCircle, BookOpen, History } from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

const SAMPLE_QUESTIONS = [
  'Khác nhau giữa 会 (huì) và 能 (néng)?',
  'Tại sao dùng 被 (bèi) trong câu bị động?',
  'Cách dùng 了 (le) và 过 (guo)?',
  '什么时候用 在 vs 正在?',
  'Giải thích 把 (bǎ) cấu trúc',
  'Cách hỏi thời gian với 几点?',
];

const CHAT_STARTERS = [
  '你好！我想练习点菜。',
  'Nǐ hǎo, wǒ xiǎng liànxí mǎi dōngxi.',
  '今天天气怎么样？',
  '请问，这个多少钱？',
];

interface ThreadInfo {
  threadId: string;
  preview: string;
  updatedAt: string;
}

export default function TutorPage() {
  const [tab, setTab] = useState<'ask' | 'chat'>('ask');
  const [threadId, setThreadId] = useState('main');
  const [question, setQuestion] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'teacher' | 'friend' | 'customer' | 'shopkeeper'>('teacher');
  const [askAnswer, setAskAnswer] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: threads } = useQuery<ThreadInfo[]>({
    queryKey: ['tutor-threads'],
    queryFn: async () => {
      const { data } = await api.get('/tutor/threads');
      return data;
    },
  });

  const { data: history } = useQuery<Message[]>({
    queryKey: ['tutor-history', threadId],
    queryFn: async () => {
      const { data } = await api.get('/tutor/history', { params: { threadId } });
      return data;
    },
  });

  const recentUserQuestions = (history ?? [])
    .filter((m) => m.role === 'USER')
    .slice(-5)
    .reverse();

  const newThreadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tutor/threads');
      return data.threadId as string;
    },
    onSuccess: (id) => {
      setThreadId(id);
      queryClient.invalidateQueries({ queryKey: ['tutor-threads'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-history', id] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/tutor/history', { params: { threadId } });
    },
    onSuccess: () => {
      setAskAnswer('');
      queryClient.invalidateQueries({ queryKey: ['tutor-history', threadId] });
    },
  });

  const askMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tutor/ask', { question }, { params: { threadId } });
      return data.answer as string;
    },
    onSuccess: (answer) => {
      setAskAnswer(answer);
      setQuestion('');
      queryClient.invalidateQueries({ queryKey: ['tutor-history', threadId] });
      queryClient.invalidateQueries({ queryKey: ['tutor-threads'] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/tutor/chat', { message, role }, { params: { threadId } });
      return data.reply as string;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['tutor-history', threadId] });
      queryClient.invalidateQueries({ queryKey: ['tutor-threads'] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, askAnswer]);

  const suggestions = tab === 'ask' ? SAMPLE_QUESTIONS : CHAT_STARTERS;

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Gia sư AI" description="Hỏi ngữ pháp hoặc luyện hội thoại" />

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
          value={threadId}
          onChange={(e) => setThreadId(e.target.value)}
        >
          <option value="main">Hội thoại chính</option>
          {threads?.map((t) => (
            <option key={t.threadId} value={t.threadId}>
              {t.preview.slice(0, 40) || t.threadId.slice(0, 8)}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => newThreadMutation.mutate()}>
          + Cuộc mới
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm('Xóa lịch sử cuộc hội thoại này?')) clearHistoryMutation.mutate();
          }}
        >
          Xóa lịch sử
        </Button>
        <Button
          variant={tab === 'ask' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('ask')}
        >
          <BookOpen className="mr-1.5 h-4 w-4" />
          Giải thích
        </Button>
        <Button
          variant={tab === 'chat' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('chat')}
        >
          <MessageCircle className="mr-1.5 h-4 w-4" />
          Hội thoại
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 xl:gap-8">
        <div className="space-y-4 lg:col-span-8">
          {tab === 'ask' ? (
            <>
              <Card>
                <CardTitle>Hỏi gia sư</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  Đặt câu hỏi ngữ pháp, từ vựng hoặc cách dùng từ — trả lời bằng tiếng Việt
                </p>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Nhập câu hỏi..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && question && askMutation.mutate()}
                  />
                  <Button
                    onClick={() => askMutation.mutate()}
                    disabled={!question || askMutation.isPending}
                  >
                    {askMutation.isPending ? 'Đang trả lời...' : 'Hỏi'}
                  </Button>
                </div>
              </Card>

              {askAnswer && (
                <Card>
                  <CardTitle className="text-base text-muted">Câu trả lời</CardTitle>
                  <div className="mt-3">
                    <TutorMarkdown content={askAnswer} />
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium">Vai trò AI</label>
                <select
                  className="rounded-lg border border-border bg-card-solid px-3 py-1.5 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="teacher">Giáo viên</option>
                  <option value="friend">Bạn bè</option>
                  <option value="customer">Khách hàng</option>
                  <option value="shopkeeper">Người bán hàng</option>
                </select>
              </div>

              <div className="min-h-[20rem] max-h-[32rem] space-y-3 overflow-y-auto rounded-xl border border-border bg-slate-50/50 p-4 xl:min-h-[24rem]">
                {!history?.length && (
                  <p className="py-8 text-center text-sm text-muted">
                    Chưa có hội thoại. Gửi tin nhắn đầu tiên hoặc chọn gợi ý bên phải.
                  </p>
                )}
                {history?.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-xl p-3 text-sm',
                      msg.role === 'USER'
                        ? 'ml-6 border border-primary/10 bg-primary/5'
                        : 'mr-6 border border-border bg-card-solid shadow-sm',
                    )}
                  >
                    {msg.role === 'ASSISTANT' ? (
                      <TutorMarkdown content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn tiếng Trung hoặc Việt..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && message && chatMutation.mutate()}
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

        <aside className="space-y-4 lg:col-span-4">
          <Card>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              {tab === 'ask' ? 'Gợi ý câu hỏi' : 'Mở lời hội thoại'}
            </CardTitle>
            <p className="mt-1 text-xs text-muted">Bấm để điền nhanh vào ô nhập</p>
            <div className="mt-3 flex flex-col gap-2">
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => (tab === 'ask' ? setQuestion(text) : setMessage(text))}
                  className="rounded-lg border border-border bg-slate-50 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/30 hover:bg-red-50/50"
                >
                  {text}
                </button>
              ))}
            </div>
          </Card>

          {recentUserQuestions.length > 0 && (
            <Card>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-primary" />
                Câu hỏi gần đây
              </CardTitle>
              <ul className="mt-3 space-y-2">
                {recentUserQuestions.map((msg) => (
                  <li key={msg.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (tab === 'ask') setQuestion(msg.content);
                        else setMessage(msg.content);
                      }}
                      className="w-full rounded-lg px-2 py-2 text-left text-sm text-muted transition-colors hover:bg-slate-50 hover:text-foreground"
                    >
                      {msg.content.length > 60
                        ? `${msg.content.slice(0, 60)}…`
                        : msg.content}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="border-primary/10 bg-gradient-to-br from-red-50/50 to-amber-50/30">
            <CardTitle className="text-base">Cách dùng hiệu quả</CardTitle>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              {tab === 'ask' ? (
                <>
                  <li>• Hỏi cụ thể một điểm ngữ pháp mỗi lần.</li>
                  <li>• Kèm ví dụ câu tiếng Trung nếu cần giải thích sâu.</li>
                  <li>• Sau khi hiểu, sang <strong className="text-foreground">Luyện tập</strong> để nhớ lâu.</li>
                </>
              ) : (
                <>
                  <li>• Cố gắng trả lời bằng tiếng Trung, AI sẽ sửa nhẹ.</li>
                  <li>• Đổi vai trò để luyện tình huống khác nhau.</li>
                  <li>• Hội thoại lưu lịch sử — quay lại ôn các mẫu câu hay.</li>
                </>
              )}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
