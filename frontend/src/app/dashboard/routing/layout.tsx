'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

const tabs = [
  { name: 'Rules', href: '/dashboard/routing/rules' },
  { name: 'Auto replies', href: '/dashboard/routing/auto-replies' },
  { name: 'Availability', href: '/dashboard/routing/business-availability' },
  { name: 'Departments', href: '/dashboard/routing/departments' },
  { name: 'Tags', href: '/dashboard/routing/tags' },
];

export default function RoutingSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex flex-col bg-white min-h-0">
          <header className="flex-shrink-0 border-b border-gray-100 px-4 pt-4 pb-3">
            <h1 className="text-lg font-semibold text-gray-900 mb-3">Routing</h1>
            <nav
              className="flex gap-1 p-1 overflow-x-auto rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
              aria-label="Routing sections"
            >
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`
                      flex-shrink-0 px-3 py-2 rounded-[10px] text-[13px] font-medium whitespace-nowrap
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]'
                          : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </header>

          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5">
            <div className="w-full max-w-2xl mx-auto">{children}</div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
