'use client';

import React, { RefObject } from 'react';
import { Conversation, Message, User } from '@/lib/api';
import { getCustomerInitial } from './channelUtils';

interface MessageThreadProps {
  messages: Message[];
  conversation: Conversation;
  staff: User[];
  currentUserName?: string;
  error?: string;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function MessageThread({
  messages,
  conversation,
  staff,
  currentUserName,
  error,
  scrollContainerRef,
  messagesEndRef,
}: MessageThreadProps) {
  const customerInitial = getCustomerInitial(conversation.customer);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-[#fafafa]"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 max-w-2xl mx-auto">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Send a reply to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isStaff = message.senderType === 'STAFF';
            const isBot = isStaff && !message.senderId;
            const senderName = isBot
              ? 'Automatic Reply'
              : isStaff
                ? staff.find((s) => s.id === message.senderId)?.name || currentUserName || 'You'
                : conversation.customer?.name || 'Customer';

            const prevMessage = index > 0 ? messages[index - 1] : null;
            const sameSender = prevMessage?.senderType === message.senderType && (prevMessage?.senderId === message.senderId);
            const showHeader = !sameSender;

            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${isStaff ? 'flex-row-reverse' : 'flex-row'} ${showHeader ? 'mt-4' : 'mt-0.5'}`}
              >
                {showHeader ? (
                  <div className="flex-shrink-0 w-7">
                    {isBot ? (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    ) : isStaff ? (
                      <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-white">
                          {(senderName || 'S').charAt(0)}
                        </span>
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {conversation.customer?.avatarUrl ? (
                          <img src={conversation.customer.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-600">{customerInitial}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-7 flex-shrink-0" />
                )}

                <div className={`flex flex-col max-w-[78%] ${isStaff ? 'items-end' : 'items-start'}`}>
                  {showHeader && (
                    <div className={`flex items-center gap-1.5 mb-1 px-1 ${isStaff ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[11px] font-medium text-gray-500">{senderName}</span>
                      {isBot && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded uppercase tracking-wider">
                          bot
                        </span>
                      )}
                      <span className="text-[11px] text-gray-300">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-3.5 py-2 ${
                      isStaff
                        ? 'bg-gray-900 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {isStaff && message.status === 'FAILED' && (
                      <p className="mt-1 text-[10px] font-medium text-red-300">Delivery failed</p>
                    )}
                    {isStaff && message.status === 'PENDING' && (
                      <p className="mt-1 text-[10px] font-medium text-gray-400">Sending…</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}
