'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/brand/logo';
import { HskLevel } from '@linguaflow/shared';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hskLevel, setHskLevel] = useState<HskLevel>(HskLevel.HSK1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, hskLevel });
      await refreshUser();
      router.push('/dashboard');
    } catch {
      setError('Không thể đăng ký. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0e] via-[#2d1218] to-[#1a1520]" />
        <div className="absolute -right-10 top-1/3 h-80 w-80 rounded-full bg-primary/25 blur-[100px]" />
        <Logo href="/" size="lg" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight text-white">
            Bắt đầu hành trình
            <br />
            <span className="bg-gradient-to-r from-accent to-amber-300 bg-clip-text text-transparent">
              学中文
            </span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/60">
            Tạo tài khoản miễn phí và học theo trình độ HSK của riêng bạn.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/30">© LinguaFlow AI</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo href="/" size="lg" variant="light" />
          </div>

          <Card className="border-0 shadow-[var(--shadow-card)]">
            <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
            <CardDescription>Bắt đầu học tiếng Trung với AI ngay hôm nay</CardDescription>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Họ tên</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Mật khẩu</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Trình độ HSK</label>
                <select
                  className="w-full rounded-xl border border-border bg-card-solid/90 px-4 py-2.5 text-sm shadow-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
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
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Đăng ký miễn phí'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
