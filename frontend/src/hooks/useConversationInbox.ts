'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, Conversation, Customer, Department, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/components/providers/SocketProvider';

export type StatusFilter = 'ALL' | 'OPEN' | 'PENDING' | 'CLOSED' | 'RESOLVED';
export type AssignmentFilter = 'ALL' | 'UNASSIGNED' | 'ASSIGNED';
export type InboxQuickFilter = 'all' | 'open' | 'pending' | 'starred';

export function useConversationInbox() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStarId, setUpdatingStarId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<InboxQuickFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const loadConversations = useCallback(async (setLoadingState = true) => {
    try {
      if (setLoadingState) setLoading(true);

      const [conversationsData, customersData] = await Promise.all([
        api.conversations.list(),
        api.customers.list(),
      ]);

      const enriched = conversationsData.map((conv) => ({
        ...conv,
        customer: conv.customer ?? customersData.find((c: Customer) => c.id === conv.customerId),
      }));

      setConversations(enriched);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await Promise.all([
        loadConversations(),
        api.departments.list().then(setDepartments).catch(() => {}),
        api.staff.list().then(setStaff).catch(() => {}),
      ]);
      if (!mounted) return;
    };
    init();
    return () => {
      mounted = false;
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: { conversation?: Conversation }) => {
      if (data?.conversation) {
        const incoming = data.conversation;
        if (user?.role === 'AGENT' && incoming.assignedTo !== user.id) return;

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === incoming.id);
          const next = exists
            ? prev.map((c) => (c.id === incoming.id ? { ...c, ...incoming } : c))
            : [incoming, ...prev];
          return next.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        });
      } else {
        loadConversations(false).catch(() => {});
      }
    };

    socket.on('conversation_updated', handleUpdate);
    return () => {
      socket.off('conversation_updated', handleUpdate);
    };
  }, [socket, user, loadConversations]);

  const staffById = useMemo(
    () => new Map(staff.map((s) => [s.id, s])),
    [staff],
  );

  const enrichedConversations = useMemo(
    () =>
      conversations.map((c) => ({
        ...c,
        assignee: c.assignedTo ? staffById.get(c.assignedTo) : undefined,
      })),
    [conversations, staffById],
  );

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return enrichedConversations.filter((conversation) => {
      if (quickFilter === 'open' && conversation.status !== 'OPEN') return false;
      if (quickFilter === 'pending' && conversation.status !== 'PENDING') return false;
      if (quickFilter === 'starred' && !conversation.isStarred) return false;

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

      if (q) {
        const name = conversation.customer?.name?.toLowerCase() ?? '';
        const email = conversation.customer?.email?.toLowerCase() ?? '';
        const phone = conversation.customer?.phone?.toLowerCase() ?? '';
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      const isAActive = a.status === 'OPEN' || a.status === 'PENDING';
      const isBActive = b.status === 'OPEN' || b.status === 'PENDING';
      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [
    enrichedConversations,
    searchQuery,
    quickFilter,
    statusFilter,
    departmentFilter,
    assignmentFilter,
  ]);

  const handleToggleStar = async (conversation: Conversation) => {
    try {
      setUpdatingStarId(conversation.id);
      const next = !conversation.isStarred;
      const updated = await api.conversations.setStarred(conversation.id, { isStarred: next });
      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, isStarred: updated.isStarred } : c)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update star');
    } finally {
      setUpdatingStarId(null);
    }
  };

  const openCount = useMemo(
    () => conversations.filter((c) => c.status === 'OPEN').length,
    [conversations],
  );

  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  return {
    conversations: filteredConversations,
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
    totalCount: conversations.length,
  };
}
