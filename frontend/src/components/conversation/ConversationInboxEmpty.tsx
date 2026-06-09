'use client';

import React from 'react';

export function ConversationInboxEmpty() {
  return (
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#fafafa] text-center px-8">
      <div className="w-16 h-16 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Your messages</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        Select a conversation from the list to view and reply.
      </p>
    </div>
  );
}
