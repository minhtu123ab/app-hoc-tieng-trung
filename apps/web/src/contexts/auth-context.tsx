'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, clearTokens, getMe, loadTokens } from '@/lib/api';
import type { UserDto } from '@linguaflow/shared';

const PUBLIC_PATHS = ['/', '/login', '/register'];

function isPublicPath(path: string) {
  return PUBLIC_PATHS.includes(path);
}

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(() => !isPublicPath(pathname));

  const refreshUser = useCallback(async () => {
    const { accessToken } = loadTokens();
    if (!accessToken) {
      setUser(null);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  // Chỉ bootstrap auth một lần khi mở app — không refetch /auth/me mỗi lần đổi tab
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const { accessToken } = loadTokens();

      if (isPublicPath(pathname)) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!accessToken) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
          router.replace('/login');
        }
        return;
      }

      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
          router.replace('/login');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy lúc mount
  }, []);

  // Đổi route: chỉ chặn nếu mất token, không bật loading toàn màn hình
  useEffect(() => {
    if (loading) return;
    if (isPublicPath(pathname)) return;

    const { accessToken } = loadTokens();
    if (!accessToken) {
      setUser(null);
      router.replace('/login');
    }
  }, [pathname, loading, router]);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { api };
