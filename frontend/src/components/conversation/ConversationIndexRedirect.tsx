'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ConversationInboxEmpty } from './ConversationInboxEmpty';

/** On desktop, open the first conversation instead of an empty right pane. */
export function ConversationIndexRedirect() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    let cancelled = false;

    api.conversations
      .list()
      .then((conversations) => {
        if (cancelled || redirected.current || conversations.length === 0) return;
        redirected.current = true;
        router.replace(`/dashboard/conversations/${conversations[0].id}`);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <ConversationInboxEmpty />;
}
