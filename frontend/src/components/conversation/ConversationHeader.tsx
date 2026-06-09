'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/lib/api';
import {
  getCustomerDisplayName,
  getCustomerInitial,
  getChannelLabel,
  getStatusColor,
  formatStatus,
} from './channelUtils';

interface ConversationHeaderProps {
  conversation: Conversation;
  onOpenCustomerPanel: () => void;
  showBack?: boolean;
}

export function ConversationHeader({
  conversation,
  onOpenCustomerPanel,
  showBack = true,
}: ConversationHeaderProps) {
  const router = useRouter();
  const customer = conversation.customer;
  const displayName = getCustomerDisplayName(customer);
  const initial = getCustomerInitial(customer);
  const channel = getChannelLabel(customer?.source);

  return (
    <header className="flex-shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/conversations')}
            className="flex-shrink-0 p-2 -ml-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCustomerPanel}
          className="flex items-center gap-3 min-w-0 flex-1 text-left group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center ring-2 ring-white shadow-sm">
              {customer?.avatarUrl ? (
                <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-gray-600">{initial}</span>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`}
              title={formatStatus(conversation.status)}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                {displayName}
              </h1>
              {conversation.isStarred && (
                <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            {channel && (
              <p className="text-xs text-gray-500 truncate">{channel}</p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenCustomerPanel}
          className="flex-shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Customer details"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
