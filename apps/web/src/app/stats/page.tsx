'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import type { StatsOverview } from '@linguaflow/shared';
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
  const { data: stats, isLoading } = useQuery<StatsOverview>({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/stats/overview');
      return data;
    },
  });

  if (isLoading) return <div className="text-muted">Đang tải...</div>;

  const modeData = Object.entries(stats?.accuracyByMode ?? {}).map(
    ([mode, data]) => ({
      mode: mode.replace(/_/g, ' '),
      accuracy: data.accuracy,
    }),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Thống kê</h1>
      <p className="mt-1 text-muted">Theo dõi tiến bộ học tập của bạn</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="text-sm text-muted">Đang quên</p>
          <p className="text-3xl font-bold text-orange-600">
            {stats?.wordsForgetting ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Chuỗi ngày</p>
          <p className="text-3xl font-bold text-red-600">
            {stats?.streakCount ?? 0}
          </p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Độ chính xác theo chế độ</CardTitle>
          <div className="mt-4 h-64">
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
          <div className="mt-4 h-64">
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
    </div>
  );
}
