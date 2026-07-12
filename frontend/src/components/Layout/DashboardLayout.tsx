'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const mainNavigation: NavItem[] = [
  {
    name: 'Conversations',
    href: '/dashboard/conversations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    name: 'Contacts',
    href: '/dashboard/customers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    name: 'Staff',
    href: '/dashboard/staff',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Routing',
    href: '/dashboard/routing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Channels',
    href: '/dashboard/channels',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2m-4-12V6a2 2 0 00-2-2H5a2 2 0 00-2 2v2m10 0H7m10 0v4m0 0H7m0 0v4m0-8V6m0 10v2a2 2 0 002 2h2a2 2 0 002-2v-2" />
      </svg>
    ),
  },
];

const bottomNavigation: NavItem[] = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const navItems = mainNavigation;
  const analyticsLocked = user?.plan != null && !user.plan.analytics;
  const handleNavIconClick = (e: React.MouseEvent) => {
    if (!sidebarCollapsed) return;
    e.preventDefault();
    setSidebarCollapsed(false);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard/conversations') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/conversations');
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="font-sans flex h-screen intra-dashboard-shell">
      {/* Sidebar */}
      <aside
        className={`h-full intra-dashboard-surface flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 border-b border-gray-200 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <Link href="/dashboard/conversations" className="flex items-center">
            <Image
              src="/intra.logo.1.png"
              alt="Logo"
              width={70}
              height={20}
              className={sidebarCollapsed ? 'h-3 w-3 object-contain' : 'h-4 w-auto'}
            />
          </Link>
          {!sidebarCollapsed && (
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={() => setSidebarCollapsed(true)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavIconClick}
                  className={`
                    flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-neutral-950 text-white shadow-lg shadow-neutral-500/30 ring-2 ring-neutral-400/50'
                      : 'text-slate-600 hover:bg-neutral-100 hover:text-slate-900 hover:shadow-md'
                    }
                  `}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-neutral-900'}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.name === 'Analytics' && analyticsLocked && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-900 text-white rounded-full shadow-md">
                      Pro
                    </span>
                  )}
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/90 text-slate-700 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavIconClick}
                  className={`
                    flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-neutral-950 text-white shadow-lg shadow-neutral-500/30 ring-2 ring-neutral-400/50'
                      : 'text-slate-600 hover:bg-neutral-100 hover:text-slate-900 hover:shadow-md'
                    }
                  `}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-neutral-900'}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-white/90 text-slate-700 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {/* Logout Button */}
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50/80 transition-colors duration-150`}
            >
              <span className="text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-3 py-4 border-t border-gray-200">
          <div className={`flex items-center px-2 ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-neutral-200 flex items-center justify-center overflow-hidden border border-white shadow-sm">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
              ) : null}
              <div className={`flex items-center justify-center w-full h-full ${user?.profilePicture ? 'hidden' : ''}`}>
                {user?.name ? (
                  <span className="text-sm font-semibold text-slate-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">
                  {(user?.orgName && user.orgName.trim() !== '') ? user.orgName : 'No Organization'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-transparent">
        {children}
      </main>
    </div>
  );
}

