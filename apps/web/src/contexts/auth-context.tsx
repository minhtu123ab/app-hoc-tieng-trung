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

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { accessToken } = loadTokens();
      const isPublic = isPublicPath(pathname);

      if (isPublic) {
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

    if (!isPublicPath(pathname)) {
      setLoading(true);
    }
    init();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

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
