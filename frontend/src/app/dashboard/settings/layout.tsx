'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

const tabs = [
  { name: 'Profile', href: '/dashboard/settings' },
  { name: 'Data policy', href: '/dashboard/settings/data-policy' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex flex-col bg-transparent min-h-0">
          <header className="flex-shrink-0 intra-dashboard-surface-strong border-b border-indigo-200/70 px-4 pt-4 pb-3">
            <h1 className="text-lg font-semibold text-slate-900 mb-3">Settings</h1>
            <nav
              className="flex gap-1 p-1 rounded-xl bg-white/75 ring-1 ring-inset ring-indigo-200/80"
              aria-label="Settings sections"
            >
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`
                      flex-1 text-center px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all
                      ${isActive ? 'bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200/70' : 'text-slate-500 hover:text-slate-700'}
                    `}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </header>
          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5">
            <div className="w-full max-w-2xl mx-auto">
              <div className="rounded-2xl intra-dashboard-surface ring-1 ring-inset ring-white/60 p-4 sm:p-5">{children}</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
