'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ContactList } from '@/components/contact/ContactList';

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasActiveContact = /^\/dashboard\/customers\/[^/]+$/.test(pathname);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex overflow-hidden bg-transparent">
          <aside
            className={`flex-shrink-0 flex flex-col border-r border-indigo-200/70 bg-white/80 backdrop-blur-md w-full lg:w-[340px] xl:w-[380px] ${
              hasActiveContact ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <ContactList />
          </aside>

          <main
            className={`flex-1 flex flex-col min-w-0 min-h-0 ${
              hasActiveContact ? 'flex' : 'hidden lg:flex'
            } bg-white/55`}
          >
            {children}
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
