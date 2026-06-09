'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Conversation } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { useConversationInbox, InboxQuickFilter } from '@/hooks/useConversationInbox';
import {
  getCustomerDisplayName,
  getCustomerInitial,
  getChannelLabel,
  formatRelativeTime,
  formatStatus,
  getStatusColor,
} from './channelUtils';

const QUICK_FILTERS: { id: InboxQuickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'pending', label: 'Pending' },
  { id: 'starred', label: 'Starred' },
];

interface ConversationInboxListProps {
  selectedId?: string | null;
}

export function ConversationInboxList({ selectedId }: ConversationInboxListProps) {
  const pathname = usePathname();
  const activeId =
    selectedId ??
    (pathname.startsWith('/dashboard/conversations/')
      ? pathname.split('/').pop() ?? null
      : null);

  const {
    conversations,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    quickFilter,
    setQuickFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    assignmentFilter,
    setAssignmentFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    departments,
    updatingStarId,
    handleToggleStar,
    openCount,
    unreadCount,
    totalCount,
  } = useConversationInbox();

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-gray-500">{unreadCount} unread</span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white focus:border-gray-300 transition-colors"
          />
        </div>

        {/* Segmented filter control */}
        <div className="mt-3 flex items-stretch gap-2">
          <div
            className="flex-1 flex p-1 min-w-0 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
            role="tablist"
            aria-label="Filter conversations"
          >
            {QUICK_FILTERS.map((f) => {
              const isActive = quickFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setQuickFilter(f.id)}
                  className={`
                    flex-1 min-w-0 flex items-center justify-center gap-1
                    py-2 px-1 sm:px-2 rounded-[10px] text-[12px] sm:text-[13px] font-medium
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]'
                        : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  <span className="truncate">{f.label}</span>
                  {f.id === 'open' && openCount > 0 && (
                    <span
                      className={`
                        inline-flex items-center justify-center min-w-[17px] h-[17px] px-1
                        rounded-full text-[10px] font-semibold tabular-nums leading-none
                        ${isActive ? 'bg-gray-900 text-white' : 'bg-gray-200/90 text-gray-600'}
                      `}
                    >
                      {openCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            aria-expanded={showAdvancedFilters}
            aria-label="More filters"
            className={`
              flex-shrink-0 flex items-center justify-center w-10 h-[42px] rounded-xl
              transition-all duration-200
              ${
                showAdvancedFilters
                  ? 'bg-gray-900 text-white shadow-sm ring-1 ring-gray-900'
                  : 'bg-gray-100/80 text-gray-500 hover:text-gray-700 hover:bg-gray-200/80 ring-1 ring-inset ring-black/[0.04]'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
          </button>
        </div>

        {/* Advanced filters */}
        {showAdvancedFilters && (
          <div className="mt-3 p-3 rounded-xl bg-gray-50/80 ring-1 ring-inset ring-black/[0.04] space-y-2.5">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as typeof statusFilter)}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
            <Select
              label="Assignment"
              value={assignmentFilter}
              onChange={(value) => setAssignmentFilter(value as typeof assignmentFilter)}
              options={[
                { value: 'ALL', label: 'All assignments' },
                { value: 'UNASSIGNED', label: 'Unassigned' },
                { value: 'ASSIGNED', label: 'Assigned' },
              ]}
            />
            {departments.length > 0 && (
              <Select
                label="Department"
                value={departmentFilter}
                onChange={(value) => setDepartmentFilter(value)}
                options={[
                  { value: 'ALL', label: 'All departments' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            Loading…
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {totalCount === 0 ? 'No conversations yet' : 'No matches'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalCount === 0
                ? 'New messages will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {conversations.map((conversation) => (
              <InboxRow
                key={conversation.id}
                conversation={conversation}
                isActive={activeId === conversation.id}
                isStarring={updatingStarId === conversation.id}
                onToggleStar={() => handleToggleStar(conversation)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InboxRow({
  conversation,
  isActive,
  isStarring,
  onToggleStar,
}: {
  conversation: Conversation;
  isActive: boolean;
  isStarring: boolean;
  onToggleStar: () => void;
}) {
  const customer = conversation.customer;
  const displayName = getCustomerDisplayName(customer);
  const initial = getCustomerInitial(customer);
  const channel = getChannelLabel(customer?.source);
  const hasUnread = (conversation.unreadCount ?? 0) > 0;
  const lastMsg = conversation.lastMessage?.content?.trim();
  const preview = lastMsg
    ? `${conversation.lastMessage?.senderType === 'STAFF' ? 'You: ' : ''}${lastMsg}`
    : conversation.customer?.email || channel || formatStatus(conversation.status);

  return (
    <li>
      <Link
        href={`/dashboard/conversations/${conversation.id}`}
        className={`flex items-center gap-3 px-4 py-3 transition-colors group ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {customer?.avatarUrl ? (
              <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-gray-600">{initial}</span>
            )}
          </div>
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gray-900 rounded-full border-2 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}
            >
              {displayName}
            </span>
            <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
              {formatRelativeTime(conversation.updatedAt)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-gray-700' : 'text-gray-500'}`}>
              {preview}
            </p>
            {conversation.isStarred && (
              <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </div>
        </div>

        {/* Star (hover) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleStar();
          }}
          disabled={isStarring}
          className={`flex-shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            conversation.isStarred ? 'opacity-100 text-amber-400' : 'text-gray-300 hover:text-amber-400'
          }`}
          aria-label={conversation.isStarred ? 'Unstar' : 'Star'}
        >
          <svg className="w-4 h-4" fill={conversation.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>

        {/* Status dot (subtle) */}
        <span
          className={`hidden sm:block w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(conversation.status)}`}
          title={formatStatus(conversation.status)}
        />
      </Link>
    </li>
  );
}
