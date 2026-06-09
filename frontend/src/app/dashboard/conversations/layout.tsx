'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ConversationInboxList } from '@/components/conversation/ConversationInboxList';

export default function ConversationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasActiveConversation = /^\/dashboard\/conversations\/[^/]+$/.test(pathname);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex overflow-hidden bg-white">
          {/* Inbox list — full width on mobile when no thread selected */}
          <aside
            className={`flex-shrink-0 flex flex-col border-r border-gray-100 bg-white w-full lg:w-[340px] xl:w-[380px] ${
              hasActiveConversation ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <ConversationInboxList />
          </aside>

          {/* Thread pane */}
          <main
            className={`flex-1 flex flex-col min-w-0 min-h-0 ${
              hasActiveConversation ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {children}
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
