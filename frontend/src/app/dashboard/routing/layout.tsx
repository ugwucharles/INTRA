'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';

const tabs = [
  { name: 'Routing rules', href: '/dashboard/routing/rules' },
  { name: 'Auto replies', href: '/dashboard/routing/auto-replies' },
  { name: 'Business availability', href: '/dashboard/routing/business-availability' },
  { name: 'Departments & assignment', href: '/dashboard/routing/departments' },
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
        <div className="h-full flex flex-col bg-white">
          <div className="border-b border-gray-200 px-8 pt-4 bg-white">
            <nav className="flex gap-4" aria-label="Routing sections">
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`
                      pb-3 text-sm font-medium border-b-2 transition-colors
                      ${
                        isActive
                          ? 'border-black text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                      }
                    `}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 flex justify-center">
            <div className="w-full max-w-3xl space-y-6">{children}</div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
