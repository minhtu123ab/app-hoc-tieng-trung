'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, api } from '@/contexts/auth-context';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { HSK_LEVEL_OPTIONS } from '@/lib/select-options';
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
import { cn } from '@/lib/utils';

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <label className="text-sm font-medium text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

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
  const voiceOptions = [
    { value: '', label: 'Mặc định hệ thống' },
    ...zhVoices.map((v) => ({
      value: v.voiceURI,
      label: `${v.name} (${v.lang})`,
    })),
  ];

  return (
    <div className="w-full space-y-6 xl:space-y-8">
      <PageHeader title="Cài đặt" description="Tài khoản, mục tiêu học và phát âm" />

      {msg && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{msg}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        <Card className="flex h-full flex-col">
          <CardTitle>Hồ sơ</CardTitle>
          <p className="mt-1 truncate text-sm text-muted">Email: {user?.email}</p>
          <div className="mt-5 flex flex-1 flex-col gap-4">
            <Field label="Tên hiển thị">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Trình độ HSK">
                <Select
                  value={hskLevel}
                  onChange={(v) => setHskLevel(v as HskLevel)}
                  options={HSK_LEVEL_OPTIONS}
                />
              </Field>
              <Field label="Mục tiêu ôn/luyện mỗi ngày">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                />
              </Field>
            </div>
            <Button
              className="mt-auto w-full sm:w-auto"
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending}
            >
              Lưu hồ sơ
            </Button>
          </div>
        </Card>

        <Card className="flex h-full flex-col">
          <CardTitle>Đổi mật khẩu</CardTitle>
          <p className="mt-1 text-sm text-muted">Mật khẩu mới tối thiểu 6 ký tự</p>
          <div className="mt-5 flex flex-1 flex-col gap-4">
            <Field label="Mật khẩu hiện tại">
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </Field>
            <Field label="Mật khẩu mới">
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="≥6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>
            <Button
              variant="outline"
              className="mt-auto w-full sm:w-auto"
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending || !currentPassword || !newPassword}
            >
              Đổi mật khẩu
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Phát âm (TTS)</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Cài đặt giọng đọc cho luyện nghe và phát âm từ vựng
          </p>
          <div className="mt-5 grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label={`Tốc độ: ${ttsRate.toFixed(2)}`}>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={ttsRate}
                className="h-2 w-full cursor-pointer accent-primary"
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setTtsRateState(v);
                  setTtsRate(v);
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>Chậm</span>
                <span>Nhanh</span>
              </div>
            </Field>
            <Field label="Giọng tiếng Trung" className="md:col-span-1 xl:col-span-1">
              <Select
                value={ttsVoice}
                onChange={(v) => {
                  setTtsVoice(v);
                  setTtsVoiceUri(v);
                }}
                options={voiceOptions}
                placeholder="Mặc định hệ thống"
              />
            </Field>
            <Field label="Tự động phát" className="md:col-span-2 xl:col-span-1">
              <label className="flex min-h-[42px] w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-slate-50/80 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-primary"
                  checked={autoPlay}
                  onChange={(e) => {
                    setAutoPlay(e.target.checked);
                    setTtsAutoPlay(e.target.checked);
                  }}
                />
                <span>Tự phát âm khi vào câu &quot;Nghe và gõ&quot;</span>
              </label>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
