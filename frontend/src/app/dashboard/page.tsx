'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, Conversation, Customer, Department } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useRouter } from 'next/navigation';

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getConversationTitle(conversation: Conversation) {
  const customer = conversation.customer;
  if (!customer) return 'Unknown Customer';
  if (customer.name) return customer.name;
  if (customer.email) return customer.email;

  if (customer.source === 'FACEBOOK_MESSENGER') {
    return 'Facebook Messenger user';
  }
  if (customer.source === 'INSTAGRAM') {
    return 'Instagram user';
  }

  return 'Unknown Customer';
}

function getChannelBadge(customer?: Customer) {
  const source = customer?.source;
  if (source === 'FACEBOOK_MESSENGER') {
    return (
      <span className="text-xs font-medium text-blue-600">Facebook</span>
    );
  }
  if (source === 'INSTAGRAM') {
    return (
      <span className="text-xs font-medium text-pink-500">Instagram</span>
    );
  }
  return null;
}

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStarId, setUpdatingStarId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'PENDING' | 'CLOSED'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // Simple polling so new inbound messages appear without a manual refresh.
  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      await Promise.all([loadConversations(), loadDepartments()]);
      if (!isMounted) return;
    };

    initialLoad();

    const intervalId = window.setInterval(() => {
      loadConversations(false).catch(() => {
        // errors are handled inside loadConversations; ignore here
      });
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const loadConversations = async (setLoadingState: boolean = true) => {
    try {
      if (setLoadingState) {
        setLoading(true);
      }
      const [conversationsData, customersData] = await Promise.all([
        api.conversations.list(),
        api.customers.list(),
      ]);

      // Merge customer data into conversations
      const enrichedConversations = conversationsData.map((conv: Conversation) => ({
        ...conv,
        customer: customersData.find((c: Customer) => c.id === conv.customerId),
      }));

      setConversations(enrichedConversations);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await api.departments.list();
      setDepartments(data);
    } catch {
      // ignore; filters are optional
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleToggleStar = async (conversation: Conversation) => {
    try {
      setUpdatingStarId(conversation.id);
      const next = !conversation.isStarred;
      const updated = await api.conversations.setStarred(conversation.id, {
        isStarred: next,
      });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, isStarred: updated.isStarred } : c)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update conversation star state',
      );
    } finally {
      setUpdatingStarId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
      <div className="h-full flex flex-col bg-white">
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm ios-appear">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Status:</span>
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as any)}
                options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'OPEN', label: 'Open' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
                className="w-auto min-w-[120px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Assignment:</span>
              <Select
                value={assignmentFilter}
                onChange={(value) => setAssignmentFilter(value as any)}
                options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'UNASSIGNED', label: 'Unassigned' },
                  { value: 'ASSIGNED', label: 'Assigned' },
                ]}
                className="w-auto min-w-[140px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Department:</span>
              <Select
                value={departmentFilter}
                onChange={(value) => setDepartmentFilter(value as any)}
                options={[
                  { value: 'ALL', label: 'All' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                className="w-auto min-w-[160px]"
              />
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-600 max-w-md">
                When customers reach out, their conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations
                .filter((conversation) => {
                  if (statusFilter !== 'ALL' && conversation.status !== statusFilter) return false;
                  if (
                    departmentFilter !== 'ALL' &&
                    conversation.departmentId &&
                    conversation.departmentId !== departmentFilter
                  ) {
                    return false;
                  }
                  if (assignmentFilter === 'UNASSIGNED' && conversation.assignedTo) return false;
                  if (assignmentFilter === 'ASSIGNED' && !conversation.assignedTo) return false;
                  return true;
                })
                .map((conversation, index) => (
                <Card
                  key={conversation.id}
                  hover
                  onClick={() => router.push(`/dashboard/conversations/${conversation.id}`)}
                  className="p-5 ios-appear"
                  style={{
                    animationDelay: `${index * 0.03}s`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    {/* Star icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(conversation);
                      }}
                      disabled={updatingStarId === conversation.id}
                      className={`mr-4 mt-1 disabled:opacity-50 transition-all duration-300 hover:scale-110 active:scale-95 ${
                        conversation.isStarred
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      aria-label={conversation.isStarred ? 'Unstar conversation' : 'Star conversation'}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 20 20"
                        fill={conversation.isStarred ? 'currentColor' : 'none'}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M10 2.5l2.39 4.848 5.347.777-3.868 3.77.913 5.326L10 14.772l-4.782 2.449.913-5.326-3.868-3.77 5.347-.777L10 2.5z"
                        />
                      </svg>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
                          <span>{getConversationTitle(conversation)}</span>
                          {conversation.unreadCount !== undefined && conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </h3>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            conversation.status
                          )}`}
                        >
                          {conversation.status}
                        </span>
                        {getChannelBadge(conversation.customer)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {conversation.customer?.email && (
                          <span className="truncate">{conversation.customer?.email}</span>
                        )}
                      </div>

                      {conversation.assignee && (
                        <div className="mt-2 text-sm text-gray-600">
                          Assigned to <span className="font-medium">{conversation.assignee.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 text-right text-sm text-gray-500 whitespace-nowrap">
                      <div>{formatTime(conversation.updatedAt)}</div>
                      {conversation.messages && conversation.messages.length > 0 && (
                        <div className="mt-1 text-xs">
                          {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}

