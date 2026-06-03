'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@linguaflow.ai');
  const [password, setPassword] = useState('demo123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      await refreshUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      setError(
        msg === 'Invalid credentials'
          ? 'Email hoặc mật khẩu không đúng'
          : msg || 'Không kết nối được API. Thử lại sau vài giây.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left panel — desktop */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0e] via-[#2d1218] to-[#1a1520]" />
        <div className="absolute inset-0 bg-[url('/logo.png')] bg-[length:400px] bg-center bg-no-repeat opacity-[0.07] blur-sm" />
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute -right-10 bottom-1/4 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />

        <Logo href="/" size="lg" />

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Học tiếng Trung
            <br />
            <span className="text-gradient">thông minh hơn</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/60">
            AI sinh từ vựng vô hạn, ôn tập SRS và luyện tập đa dạng — mọi thứ trong một nền tảng.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-white/40">
            <span>✦ AI Gemini</span>
            <span>✦ SRS thông minh</span>
            <span>✦ 6 chế độ luyện</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">
          © LinguaFlow AI · 流利中文
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo href="/" size="lg" variant="light" />
          </div>

          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardTitle className="text-2xl">Chào mừng trở lại</CardTitle>
            <CardDescription>Đăng nhập để tiếp tục hành trình học tiếng Trung</CardDescription>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Đăng ký miễn phí
              </Link>
            </p>
            <p className="mt-3 rounded-xl bg-accent-soft/50 px-3 py-2 text-center text-xs text-muted">
              Demo: <strong>demo@linguaflow.ai</strong> / <strong>demo123456</strong>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
