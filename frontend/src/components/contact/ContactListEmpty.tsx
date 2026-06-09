'use client';

import React from 'react';

export function ContactListEmpty() {
  return (
    <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#fafafa] text-center px-8">
      <div className="w-16 h-16 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Your contacts</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        Select a contact from the list to view their profile and conversation history.
      </p>
    </div>
  );
}
