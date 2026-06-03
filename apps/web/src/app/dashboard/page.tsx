'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/contexts/auth-context';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StatsOverview } from '@linguaflow/shared';
import { Brain, Flame, BookMarked, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats } = useQuery<StatsOverview>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/overview');
      return data;
    },
    enabled: !!user,
  });

  const cards = [
    {
      label: 'Cần ôn hôm nay',
      value: stats?.wordsDueToday ?? 0,
      icon: Brain,
      href: '/review',
      gradient: 'from-rose-500/10 to-red-500/5',
      iconBg: 'bg-rose-500/10 text-rose-600',
    },
    {
      label: 'Chuỗi ngày học',
      value: stats?.streakCount ?? user?.streakCount ?? 0,
      icon: Flame,
      href: '/stats',
      gradient: 'from-orange-500/10 to-amber-500/5',
      iconBg: 'bg-orange-500/10 text-orange-600',
    },
    {
      label: 'Đã thành thạo',
      value: stats?.wordsMastered ?? 0,
      icon: BookMarked,
      href: '/stats',
      gradient: 'from-emerald-500/10 to-green-500/5',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Đang học',
      value: stats?.wordsLearned ?? 0,
      icon: TrendingUp,
      href: '/decks',
      gradient: 'from-blue-500/10 to-indigo-500/5',
      iconBg: 'bg-blue-500/10 text-blue-600',
    },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 via-primary to-primary-dark p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 right-1/4 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70">Chào mừng trở lại 👋</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user?.name}</h1>
          <p className="mt-2 text-white/80">
            Trình độ <span className="rounded-md bg-white/15 px-2 py-0.5 font-semibold">{user?.hskLevel}</span>
            — sẵn sàng học hôm nay?
          </p>
          {(stats?.wordsDueToday ?? 0) > 0 && (
            <Link href="/review">
              <Button variant="accent" size="sm" className="mt-4 gap-2">
                <Brain className="h-4 w-4" />
                Ôn {stats?.wordsDueToday} từ ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, gradient, iconBg }) => (
          <Link key={label} href={href} className="group">
            <Card
              className={cn(
                'relative overflow-hidden border-0 bg-gradient-to-br p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg',
                gradient,
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
                </div>
                <div className={cn('rounded-xl p-2.5', iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Bắt đầu nhanh</CardTitle>
          <CardDescription>Các hành động phổ biến nhất</CardDescription>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Link href="/review">
              <Button className="w-full justify-start gap-2" size="lg">
                <Brain className="h-4 w-4" /> Ôn tập SRS
              </Button>
            </Link>
            <Link href="/generate">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                <Sparkles className="h-4 w-4" /> Sinh từ AI
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                Luyện tập
              </Button>
            </Link>
            <Link href="/tutor">
              <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                Gia sư AI
              </Button>
            </Link>
          </div>
        </Card>
        <Card>
          <CardTitle>Mẹo học hiệu quả</CardTitle>
          <CardDescription>Quy trình gợi ý mỗi ngày</CardDescription>
          <ol className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
              Sinh hoặc chọn bộ từ theo chủ đề
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
              Ôn SRS — ưu tiên từ đến hạn
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
              Luyện tập 15–20 phút với nhiều chế độ
            </li>
          </ol>
          <Link href="/guide" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Xem hướng dẫn chi tiết <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
