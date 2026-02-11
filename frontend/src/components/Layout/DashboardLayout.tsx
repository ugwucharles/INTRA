'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, Conversation } from '@/lib/api';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const baseNavigation: NavItem[] = [
  {
    name: 'Conversations',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
      </svg>
    ),
  },
  {
    name: 'Staff',
    href: '/dashboard/staff',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Sharp briefcase / team icon */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3zm2-1a1 1 0 0 0-1 1v1h4V6a1 1 0 0 0-1-1h-2zm-5 6h12"
        />
      </svg>
    ),
  },
  {
    name: 'Routing',
    href: '/dashboard/routing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 16h10M4 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm10 8a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"
        />
      </svg>
    ),
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [conversationCount, setConversationCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (pathname !== '/dashboard') return;

    let cancelled = false;
    const loadCount = async () => {
      try {
        const conversations: Conversation[] = await api.conversations.list();
        if (!cancelled) {
          setConversationCount(conversations.length);
        }
      } catch {
        if (!cancelled) {
          setConversationCount(null);
        }
      }
    };

    loadCount();
    const intervalId = window.setInterval(loadCount, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  const navigation = React.useMemo(() => {
    if (!user) return baseNavigation;
    if (user.role === 'ADMIN') return baseNavigation;
    // Non-admins: hide Staff and Routing links
    return baseNavigation.filter(
      (item) => item.href !== '/dashboard/staff' && item.href !== '/dashboard/routing',
    );
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-50 px-4 py-4 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 mr-4 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl flex flex-col shadow-lg shadow-gray-900/5 overflow-hidden ios-appear">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">INTRA</h1>
          <p className="text-xs text-gray-500 mt-1">Social CRM</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navigation.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-2xl
                  transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                  ios-appear
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-100/80 active:scale-[0.98]'
                  }
                `}
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content with top user bar */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar with page title on left and user info on right */}
        <header className="h-20 mb-3 border border-gray-200 bg-white/90 backdrop-blur-xl rounded-3xl flex items-center justify-between px-8 shadow-md ios-appear">
          <div className="flex items-center">
            {pathname === '/dashboard' && (
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Conversations</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {conversationCount ?? 0}{' '}
                  {conversationCount === 1 ? 'conversation' : 'conversations'}
                </p>
              </div>
            )}
            {pathname.startsWith('/dashboard/routing') && (
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Routing</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure routing rules, auto replies, and departments for automatic assignment.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 truncate flex items-center justify-end gap-2">
                {user?.name}
                {user && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.isOnline ?? true
                        ? 'bg-green-500 animate-breathing'
                        : 'bg-gray-400'
                    }`}
                  />
                )}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-xs">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-gray-200 flex items-center justify-center shadow-[0_0_0_1px_rgba(148,163,184,0.4)]">
              <span className="text-xs font-semibold text-gray-800">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

      {/* Page content */}
        <div className="flex-1 overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-200 ios-appear">
          {children}
        </div>
      </main>
    </div>
  );
}

