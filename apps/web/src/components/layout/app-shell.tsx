'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Brain,
  BarChart3,
  Sparkles,
  MessageCircle,
  LayoutDashboard,
  LogOut,
  CircleHelp,
  Dumbbell,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Menu,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/generate', label: 'Sinh từ AI', icon: Sparkles },
  { href: '/decks', label: 'Bộ từ', icon: BookOpen },
  { href: '/review', label: 'Ôn tập SRS', icon: Brain },
  { href: '/practice', label: 'Luyện tập', icon: Dumbbell },
  { href: '/tutor', label: 'Gia sư AI', icon: MessageCircle },
  { href: '/stats', label: 'Thống kê', icon: BarChart3 },
  { href: '/guide', label: 'Hướng dẫn', icon: CircleHelp },
];

const PUBLIC_PATHS = ['/', '/login', '/register'];
const SIDEBAR_KEY = 'lf_sidebar_collapsed';

function NavLinks({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-primary/20 text-white shadow-inner shadow-primary/10'
                : 'text-sidebar-text hover:bg-white/8 hover:text-white',
              collapsed && 'justify-center px-2',
            )}
          >
            <Icon
              className={cn(
                'h-[1.125rem] w-[1.125rem] shrink-0 transition-colors',
                active ? 'text-accent' : 'text-white/50 group-hover:text-white/80',
              )}
            />
            {!collapsed && <span className="truncate">{label}</span>}
            {active && !collapsed && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  collapsed,
  pathname,
  user,
  onLogout,
  onToggle,
  onNavigate,
  onClose,
  showToggle = true,
}: {
  collapsed: boolean;
  pathname: string;
  user: { name: string; hskLevel: string };
  onLogout: () => void;
  onToggle: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
  showToggle?: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          'flex items-center border-b border-sidebar-border px-4 py-5',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        <Logo collapsed={collapsed} size={collapsed ? 'sm' : 'md'} href="/dashboard" />
        {onClose && !collapsed && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {showToggle && !collapsed && !onClose && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Thu gọn sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {showToggle && collapsed && (
        <div className="flex justify-center border-b border-sidebar-border py-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Mở rộng sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      <NavLinks collapsed={collapsed} pathname={pathname} onNavigate={onNavigate} />

      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="truncate text-xs text-white/50">{user.hskLevel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            className="mx-auto flex rounded-lg p-2.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const showSidebar = !loading && !!user && !isPublic;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-pulse rounded-xl bg-primary/20" />
          <p className="text-sm text-muted">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!showSidebar) return <>{children}</>;

  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div className="min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col bg-sidebar transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {user && (
          <SidebarContent
            collapsed={false}
            pathname={pathname}
            user={user}
            onLogout={logout}
            onToggle={toggleCollapsed}
            onNavigate={() => setMobileOpen(false)}
            onClose={() => setMobileOpen(false)}
            showToggle={false}
          />
        )}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out lg:flex"
        style={{ width: sidebarWidth }}
      >
        {user && (
          <SidebarContent
            collapsed={collapsed}
            pathname={pathname}
            user={user}
            onLogout={logout}
            onToggle={toggleCollapsed}
          />
        )}
      </aside>

      {/* Main area */}
      <div
        className="flex min-h-screen flex-col transition-[margin] duration-300 ease-in-out lg:ml-[var(--sidebar-offset)]"
        style={
          {
            '--sidebar-offset': sidebarWidth,
          } as React.CSSProperties
        }
      >
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-border bg-card-solid p-2.5 shadow-sm"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <Logo variant="light" showText size="md" href="/dashboard" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
