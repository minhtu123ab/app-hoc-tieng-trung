'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { PageSkeleton, EmptyState } from '@/components/ui/states';
import type { StatsOverview } from '@linguaflow/shared';
import { PRACTICE_MODE_LABELS, PracticeMode } from '@linguaflow/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function StatsPage() {
  const { data: stats, isLoading, error, refetch } = useQuery<StatsOverview>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/overview');
      return data;
    },
  });

  if (isLoading) return <PageSkeleton />;
  if (error) {
    return (
      <EmptyState title="Không tải thống kê" action={<button type="button" onClick={() => refetch()}>Thử lại</button>} />
    );
  }

  const modeData = Object.entries(stats?.accuracyByMode ?? {}).map(
    ([mode, data]) => ({
      mode:
        PRACTICE_MODE_LABELS[mode as PracticeMode] ??
        mode.replace(/_/g, ' '),
      accuracy: data.accuracy,
    }),
  );

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader title="Thống kê" description="Theo dõi tiến bộ học tập của bạn" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Đã học</p>
          <p className="text-3xl font-bold">{stats?.wordsLearned ?? 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Thành thạo</p>
          <p className="text-3xl font-bold text-green-600">
            {stats?.wordsMastered ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Cần ôn</p>
          <p className="text-3xl font-bold text-rose-600">
            {stats?.wordsDueNow ?? stats?.wordsDueToday ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Chuỗi ngày</p>
          <p className="text-3xl font-bold text-orange-600">
            {stats?.streakCount ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Độ chính xác theo chế độ</CardTitle>
          <div className="mt-4 h-64 xl:h-80">
            {modeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mode" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted">
                Chưa có dữ liệu luyện tập
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Tiến bộ 30 ngày</CardTitle>
          <div className="mt-4 h-64 xl:h-80">
            {stats?.progressOverTime?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="reviews"
                    stroke="#dc2626"
                    name="Lượt ôn"
                  />
                  <Line
                    type="monotone"
                    dataKey="correct"
                    stroke="#16a34a"
                    name="Đúng"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted">
                Chưa có dữ liệu ôn tập
              </p>
            )}
          </div>
        </Card>
      </div>

      {stats?.deckStats && stats.deckStats.length > 0 && (
        <Card>
          <CardTitle>Tiến độ theo bộ từ</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted">
                  <th className="py-2 pr-4">Bộ từ</th>
                  <th className="py-2 pr-4">Tổng</th>
                  <th className="py-2 pr-4">Đã học</th>
                  <th className="py-2">Thành thạo</th>
                </tr>
              </thead>
              <tbody>
                {stats.deckStats.map((d) => (
                  <tr key={d.deckId} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{d.title}</td>
                    <td className="py-3 pr-4">{d.wordCount}</td>
                    <td className="py-3 pr-4">{d.learned}</td>
                    <td className="py-3">{d.mastered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
