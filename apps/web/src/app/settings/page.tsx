'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { HskLevel } from '@linguaflow/shared';
import {
  getTtsAutoPlay,
  getTtsRate,
  getTtsVoiceUri,
  setTtsAutoPlay,
  setTtsRate,
  setTtsVoiceUri,
} from '@/lib/tts-settings';
import { loadVoices } from '@/lib/tts';

const HSK_LEVELS = Object.values(HskLevel);

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>(HskLevel.HSK1);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsRate, setTtsRateState] = useState(0.85);
  const [ttsVoice, setTtsVoice] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHskLevel(user.hskLevel);
      setDailyGoal(user.dailyGoal ?? 20);
    }
  }, [user]);

  useEffect(() => {
    setTtsRateState(getTtsRate());
    setTtsVoice(getTtsVoiceUri() ?? '');
    setAutoPlay(getTtsAutoPlay());
    void loadVoices().then(setVoices);
  }, []);

  const profileMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/auth/profile', { name, hskLevel, dailyGoal });
    },
    onSuccess: async () => {
      await refreshUser?.();
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setMsg('Đã lưu hồ sơ');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/change-password', { currentPassword, newPassword });
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Đã đổi mật khẩu');
    },
  });

  const zhVoices = voices.filter((v) => v.lang.startsWith('zh'));

  return (
    <div className="w-full max-w-2xl space-y-6">
      <PageHeader title="Cài đặt" description="Tài khoản, mục tiêu học và phát âm" />

      {msg && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>
      )}

      <Card>
        <CardTitle>Hồ sơ</CardTitle>
        <p className="mt-1 text-sm text-muted">Email: {user?.email}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-muted">Tên hiển thị</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted">Trình độ HSK</label>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={hskLevel}
              onChange={(e) => setHskLevel(e.target.value as HskLevel)}
            >
              {HSK_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted">Mục tiêu ôn/luyện mỗi ngày</label>
            <Input
              type="number"
              min={1}
              max={500}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <Button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
          >
            Lưu hồ sơ
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <div className="mt-4 space-y-3">
          <Input
            type="password"
            placeholder="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mật khẩu mới (≥6 ký tự)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Phát âm (TTS)</CardTitle>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-muted">
              Tốc độ: {ttsRate.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.5}
              max={1.5}
              step={0.05}
              value={ttsRate}
              className="mt-2 w-full"
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setTtsRateState(v);
                setTtsRate(v);
              }}
            />
          </div>
          <div>
            <label className="text-sm text-muted">Giọng tiếng Trung</label>
            <select
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={ttsVoice}
              onChange={(e) => {
                setTtsVoice(e.target.value);
                setTtsVoiceUri(e.target.value);
              }}
            >
              <option value="">Mặc định hệ thống</option>
              {zhVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => {
                setAutoPlay(e.target.checked);
                setTtsAutoPlay(e.target.checked);
              }}
            />
            Tự phát âm khi vào câu &quot;Nghe và gõ&quot;
          </label>
        </div>
      </Card>
    </div>
  );
}
