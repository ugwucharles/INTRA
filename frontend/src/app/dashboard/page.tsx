'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, Conversation, Customer, Department, User } from '@/lib/api';
import { useSocket } from '@/components/providers/SocketProvider';
import { useAuth } from '@/contexts/AuthContext';
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
  if (customer.source === 'WHATSAPP') {
    return 'WhatsApp user';
  }
  if (customer.source === 'EMAIL') {
    return 'Email user';
  }

  return 'Unknown Customer';
}

function getChannelBadge(customer?: Customer) {
  const source = customer?.source;
  if (source === 'FACEBOOK_MESSENGER') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/50">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.356 2 1.77 6.136 1.77 11.233c0 2.923 1.458 5.485 3.737 7.15V22l3.414-1.879c1.01.278 2.062.435 3.16.435 5.644 0 10.23-4.135 10.23-9.233S17.644 2 12 2zm1.096 12.396l-2.827-3.02-5.503 3.02 6.045-6.427 2.914 3.02 5.412-3.02-6.041 6.427z"/>
        </svg>
        Facebook
      </span>
    );
  }
  if (source === 'INSTAGRAM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200/50">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
        Instagram
      </span>
    );
  }
  if (source === 'WHATSAPP') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200/50">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        WhatsApp
      </span>
    );
  }
  if (source === 'EMAIL') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200/50">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
        Email
      </span>
    );
  }
  return null;
}

export default function ConversationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStarId, setUpdatingStarId] = useState<string | null>(null);
  const { socket } = useSocket();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'PENDING' | 'CLOSED' | 'RESOLVED'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
  const [staffInfo, setStaffInfo] = useState({ total: 0, active: 0, agents: 0, agentsList: [] as User[], activeList: [] as User[] });

  // Simple polling so new inbound messages appear without a manual refresh.
  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      await Promise.all([loadConversations(), loadDepartments(), loadStaffCount()]);
      if (!isMounted) return;
    };

    initialLoad();
 
    return () => {
      isMounted = false;
    };
  }, []);
 
  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: any) => {
      // If the payload includes the full conversation object, update state directly
      // without making any API calls — this is the fast path for new inbound emails.
      if (data?.conversation) {
        const incoming: Conversation = data.conversation;

        // Agents only see conversations assigned to them; skip anything else.
        if (user?.role === 'AGENT' && incoming.assignedTo !== user.id) {
          return;
        }

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === incoming.id);
          if (exists) {
            // Replace existing entry and keep sort order (newest updatedAt first)
            return [...prev.map((c) => (c.id === incoming.id ? incoming : c))].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );
          }
          // New conversation — prepend it
          return [incoming, ...prev];
        });
      } else {
        // Fallback: payload has no conversation object, do a full refresh
        console.log('Dashboard refreshing due to conversation_updated event (no payload)');
        loadConversations(false).catch(() => {});
      }
    };

    socket.on('conversation_updated', handleUpdate);

    return () => {
      socket.off('conversation_updated', handleUpdate);
    };
  }, [socket, user]);

  const loadConversations = async (setLoadingState: boolean = true) => {
    try {
      if (setLoadingState) {
        setLoading(true);
      }

      let conversationsData: any[], customersData: any[];

      [conversationsData, customersData] = await Promise.all([
        api.conversations.list(),
        api.customers.list(),
      ]);

      // Merge customer data into conversations
      const enrichedConversations = conversationsData.map((conv: any) => ({
        ...conv,
        customer: customersData.find((c: any) => c.id === conv.customerId),
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

  const loadStaffCount = async () => {
    try {
      const data = await api.staff.list();
      const total = data.length;
      const activeList = data.filter((s: { isOnline?: boolean }) => s.isOnline);
      const active = activeList.length;
      const agentsList = data.filter((s: { role: string }) => s.role === 'AGENT');
      const agents = agentsList.length;
      setStaffInfo({ total, active, agents, agentsList, activeList });
    } catch {
      // ignore
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-700';
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
        <div className="h-full flex flex-col bg-white overflow-hidden">
          {/* Stats Cards */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              {/* Total Conversations */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5">
                <div className="flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-500 text-center">Total Conversations</span>
                </div>
                <div className="mt-1 sm:mt-2 flex items-baseline justify-center gap-2">
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-900">{conversations.length}</span>
                </div>
              </div>

              {/* Staff */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5">
                <div className="flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">Staff</span>
                </div>
                <div className="mt-1 sm:mt-2 flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-900">{staffInfo.agents}</span>
                  <div className="hidden sm:flex -space-x-2">
                    {staffInfo.agentsList.slice(0, 3).map((agent, i) => (
                      <div key={agent.id} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex items-center justify-center">
                        {agent.profilePicture ? (
                          <img src={agent.profilePicture} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500">{agent.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                    {staffInfo.agents > 3 && (
                      <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium text-orange-600">+{staffInfo.agents - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Now */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5">
                <div className="flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">Active Now</span>
                </div>
                <div className="mt-1 sm:mt-2 flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-semibold text-gray-900">{staffInfo.active}</span>
                  <div className="hidden sm:flex -space-x-2">
                    {staffInfo.activeList.map((agent, i) => (
                      <div key={agent.id || i} className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white overflow-hidden flex items-center justify-center relative group">
                        {agent.profilePicture ? (
                          <img src={agent.profilePicture} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600">{agent.name?.charAt(0).toUpperCase()}</span>
                        )}
                        <div className="absolute top-10 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {agent.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Filters */}
            <div className="mb-6 grid grid-cols-3 gap-2 text-xs ios-appear filters-compact-mobile">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium whitespace-nowrap">Status:</span>
                <Select
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as any)}
                  hideValueOnMobile
                  options={[
                    { value: 'ALL', label: 'All' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'RESOLVED', label: 'Resolved' },
                    { value: 'CLOSED', label: 'Closed' },
                  ]}
                  className="w-full min-w-0"
                />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium whitespace-nowrap">Assignment:</span>
                <Select
                  value={assignmentFilter}
                  onChange={(value) => setAssignmentFilter(value as any)}
                  hideValueOnMobile
                  options={[
                    { value: 'ALL', label: 'All' },
                    { value: 'UNASSIGNED', label: 'Unassigned' },
                    { value: 'ASSIGNED', label: 'Assigned' },
                  ]}
                  className="w-full min-w-0"
                />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-gray-600 font-medium whitespace-nowrap">Department:</span>
                <Select
                  value={departmentFilter}
                  onChange={(value) => setDepartmentFilter(value as any)}
                  hideValueOnMobile
                  align="right"
                  options={[
                    { value: 'ALL', label: 'All' },
                    ...departments.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                  className="w-full min-w-0"
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
                          className={`mr-4 mt-1 disabled:opacity-50 transition-all duration-300 hover:scale-110 active:scale-95 ${conversation.isStarred
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

