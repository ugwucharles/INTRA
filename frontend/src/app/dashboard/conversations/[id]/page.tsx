'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  api,
  Conversation,
  Message,
  Customer,
  User,
  Tag,
  ConversationNote,
  SavedReply,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/components/providers/SocketProvider';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const conversationId = params.id as string;
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historicalMessages, setHistoricalMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);
  const [updatingStar, setUpdatingStar] = useState(false);

  // Conversation tags (labels)
  const [conversationTags, setConversationTags] = useState<Tag[]>([]);
  const [availableConversationTags, setAvailableConversationTags] = useState<Tag[]>([]);
  const [, setLoadingTags] = useState(false);

  // Shared internal conversation notes
  const [conversationNotes, setConversationNotes] = useState<ConversationNote[]>([]);
  const [newConversationNote, setNewConversationNote] = useState('');
  const [savingConversationNote, setSavingConversationNote] = useState(false);

  // Contact editing state
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [savingContact, setSavingContact] = useState(false);

  // Private notes: one blob per contact per agent, stored on the server
  const [note, setNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // @-mention suggestions
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);

  // Saved replies (templates)
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [showSavedReplies, setShowSavedReplies] = useState(false);
  const [savedReplyQuery, setSavedReplyQuery] = useState('');

  // Internal notes modal
  const [showInternalNotesModal, setShowInternalNotesModal] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages(true);
    }
  }, [conversationId]);

  // Load staff list for ADMIN users so they can assign conversations
  useEffect(() => {
    if (!isAdmin) return;

    const loadStaff = async () => {
      try {
        const data = await api.staff.list();
        setStaff(data);
      } catch (err) {
        // errors are shown via general error banner if needed
      }
    };

    loadStaff();
  }, [isAdmin]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket || !conversationId) return;
 
    const eventName = `new_message_${conversationId}`;
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      loadConversation(); // Refresh conversation stats/status
    };
 
    socket.on(eventName, handleNewMessage);
 
    return () => {
      socket.off(eventName, handleNewMessage);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    // On first messages load, force scroll. On subsequent polled loads, only scroll if near bottom.
    if (messages.length > 0) {
      scrollToBottom(initialLoading);
    }
  }, [messages]);

  const scrollToBottom = (force: boolean = false) => {
    if (!force && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (!isNearBottom) return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const [conversationsData, customersData] = await Promise.all([
        api.conversations.list(),
        api.customers.list(),
      ]);
      const conv = conversationsData.find((c: Conversation) => c.id === conversationId);
      if (conv) {
        const enrichedConv = {
          ...conv,
          customer: customersData.find((c: Customer) => c.id === conv.customerId),
        } as Conversation & { customer?: Customer };
        setConversation(enrichedConv);

        // Load historic messages from previous conversations for this customer once
        if (!historyLoaded) {
          const previousConversations = conversationsData.filter(
            (c) =>
              c.customerId === conv.customerId &&
              c.id !== conversationId &&
              new Date(c.createdAt) < new Date(conv.createdAt),
          );

          if (previousConversations.length > 0) {
            const allPrevMessagesArrays = await Promise.all(
              previousConversations.map((c) => api.messages.list(c.id)),
            );
            const combined = allPrevMessagesArrays.flat().sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            setHistoricalMessages(combined);
          }
          setHistoryLoaded(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    }
  };

  const loadMessages = async (showSpinner: boolean = true) => {
    try {
      if (showSpinner) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }
      const data = await api.messages.list(conversationId);
      setMessages(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      if (showSpinner) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.messages.create(conversationId, { content: newMessage });
      setNewMessage('');
      await loadConversation();
      // Reload messages and force scroll since we just sent one
      await loadMessages(false);
      scrollToBottom(true);
      setShowMentionList(false);
      setMentionQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNoteMode) {
      if (!noteDraft.trim() || savingNote) return;
      await handleSaveNote(noteDraft.trim());
      setIsNoteMode(false);
      setNoteDraft('');
      return;
    }

    if (!conversation || conversation.status === 'CLOSED' || conversation.status === 'RESOLVED') {
      return;
    }

    await sendMessage();
  };

  const handleAssignConversation = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const assigneeId = e.target.value;
    if (!assigneeId || assigning) return;

    setAssigning(true);
    try {
      await api.conversations.assign(conversationId, { assigneeId });
      await loadConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign conversation');
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!confirm('Are you sure you want to close this conversation?')) return;

    try {
      await api.conversations.close(conversationId);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close conversation');
    }
  };

  const handleResolveConversation = async () => {
    if (!confirm('Resolve this conversation and request customer rating?')) return;

    try {
      await api.conversations.resolve(conversationId);
      await loadConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conversation');
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation?.customerId || savingContact) return;

    setSavingContact(true);
    try {
      const payload = {
        name: contactForm.name.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
      };
      await api.customers.update(conversation.customerId, payload);
      setEditingContact(false);
      setSavingContact(false);
      await loadConversation();
    } catch (err) {
      setSavingContact(false);
      setError(err instanceof Error ? err.message : 'Failed to update contact');
    }
  };

  const handleToggleStar = async () => {
    if (!conversation || updatingStar) return;

    setUpdatingStar(true);
    try {
      const next = !conversation.isStarred;
      const updated = await api.conversations.setStarred(conversationId, {
        isStarred: next,
      });
      setConversation((prev) => (prev ? { ...prev, isStarred: updated.isStarred } : prev));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update conversation star state',
      );
    } finally {
      setUpdatingStar(false);
    }
  };

  // Load private note for this contact (per agent) from the server once.
  useEffect(() => {
    if (!conversation || !user || noteLoaded) return;

    const fetchNote = async () => {
      try {
        const res = await api.customers.getNote(conversation.customerId);
        setNote(res.content ?? '');
      } catch {
        // Silent fail; notes are optional and should not break the conversation view.
      } finally {
        setNoteLoaded(true);
      }
    };

    fetchNote();
  }, [conversation, user, noteLoaded]);

  const handleSaveNote = async (content: string) => {
    if (!conversation || !user || savingNote) return;

    setSavingNote(true);
    try {
      const res = await api.customers.saveNote(conversation.customerId, { content });
      setNote(res.content ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  // Load internal shared conversation notes once we know the conversation
  useEffect(() => {
    if (!conversation) return;

    const loadNotes = async () => {
      try {
        const data = await api.conversations.listNotes(conversation.id);
        setConversationNotes(data);
      } catch {
        // internal notes are optional; don't break view
      }
    };

    loadNotes();
  }, [conversation]);

  // Load available tags and existing tags for this conversation
  useEffect(() => {
    if (!conversation) return;

    const loadTags = async () => {
      try {
        setLoadingTags(true);
        const [allTags, convTags] = await Promise.all([
          api.tags.list('CONVERSATION'),
          api.conversations.listTags(conversation.id),
        ]);
        setAvailableConversationTags(allTags);
        setConversationTags(convTags);
      } catch {
        // optional, ignore errors
      } finally {
        setLoadingTags(false);
      }
    };

    loadTags();
  }, [conversation]);

  const toggleConversationTag = async (tagId: string) => {
    if (!conversation) return;

    try {
      const hasTag = conversationTags.some((t) => t.id === tagId);
      const updated = hasTag
        ? await api.conversations.removeTag(conversation.id, tagId)
        : await api.conversations.addTag(conversation.id, { tagId });
      setConversationTags(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update labels');
    }
  };

  // Load saved replies scoped to this conversation's department if present
  useEffect(() => {
    const loadSavedReplies = async () => {
      try {
        const replies = await api.savedReplies.list(conversation?.departmentId ?? undefined);
        setSavedReplies(replies);
      } catch {
        // optional, ignore errors
      }
    };

    loadSavedReplies();
  }, [conversation?.departmentId]);

  if (initialLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading conversation...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!conversation) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
              <Button onClick={() => router.push('/dashboard')}>Back to Conversations</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const isClosed = conversation.status === 'CLOSED';
  const isResolved = conversation.status === 'RESOLVED';
  const isInactiveConversation = isClosed || isResolved;
  const allMessages = [...historicalMessages, ...messages];
  const customerInitial = (conversation.customer?.name || conversation.customer?.email || '?')
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-8 py-5 ios-appear">
              <div className="flex items-center justify-between gap-6">
                {/* Left: avatar, name and platform */}
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="!p-2 flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        conversation.customerId &&
                        router.push(`/dashboard/customers/${conversation.customerId}`)
                      }
                      className="flex items-center gap-3 min-w-0 text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700 flex-shrink-0">
                        {customerInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900 truncate group-hover:underline">
                            {conversation.customer?.name ||
                              (conversation.customer?.source === 'FACEBOOK_MESSENGER'
                                ? 'Facebook Messenger user'
                                : conversation.customer?.source === 'INSTAGRAM'
                                  ? 'Instagram user'
                                  : conversation.customer?.source === 'WHATSAPP'
                                    ? 'WhatsApp user'
                                    : conversation.customer?.source === 'EMAIL'
                                      ? 'Email user'
                                      : conversation.customer?.email || 'Unknown Customer')}
                          </span>
                        </div>
                        {/* Inline contact info under name */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          {conversation.customer?.email && <span>{conversation.customer.email}</span>}
                          {conversation.customer?.source === 'FACEBOOK_MESSENGER' && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium text-blue-600 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.356 2 1.77 6.136 1.77 11.233c0 2.923 1.458 5.485 3.737 7.15V22l3.414-1.879c1.01.278 2.062.435 3.16.435 5.644 0 10.23-4.135 10.23-9.233S17.644 2 12 2zm1.096 12.396l-2.827-3.02-5.503 3.02 6.045-6.427 2.914 3.02 5.412-3.02-6.041 6.427z"/>
                              </svg>
                              Facebook
                            </span>
                          )}
                          {conversation.customer?.source === 'INSTAGRAM' && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium text-pink-500 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                              </svg>
                              Instagram
                            </span>
                          )}
                          {conversation.customer?.source === 'WHATSAPP' && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium text-green-600 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              WhatsApp
                            </span>
                          )}
                          {conversation.customer?.source === 'EMAIL' && (
                            <span
                              className={`inline-flex items-center gap-1 font-medium text-gray-700 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                                }`}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="20" height="16" x="2" y="4" rx="2"/>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                              </svg>
                              Email
                            </span>
                          )}
                        </div>
                        {conversationTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {conversationTags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Right: action icons (add contact, tag, search, star, close) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Add to contact icon */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!conversation.customer) return;
                      setEditingContact(true);
                      setContactForm({
                        name: conversation.customer?.name || '',
                        email: conversation.customer?.email || '',
                        phone: conversation.customer?.phone || '',
                      });
                    }}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition-all duration-200 ${editingContact
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    title={
                      conversation.customer?.name ||
                        conversation.customer?.email ||
                        conversation.customer?.phone
                        ? 'Edit contact'
                        : 'Add to contacts'
                    }
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path
                        d="M10 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.5 16.5c.8-2.1 2.8-3.5 5.5-3.5 2.7 0 4.7 1.4 5.5 3.5"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.5 7.5v3m1.5-1.5h-3"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  {/* Status Dropdown */}
                  <div className="relative inline-flex items-center justify-center">
                    <Select
                      value={conversation.status}
                      onChange={async (value) => {
                        try {
                          const status = value as 'OPEN' | 'PENDING';
                          await api.conversations.updateStatus(conversationId, { status });
                          setConversation((prev) => (prev ? { ...prev, status } : prev));
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to update status');
                        }
                      }}
                      options={
                        conversation.status === 'CLOSED' || conversation.status === 'RESOLVED' 
                        ? [{ value: conversation.status, label: conversation.status === 'CLOSED' ? 'Closed' : 'Resolved' }] 
                        : [
                            { value: 'OPEN', label: 'Open' },
                            { value: 'PENDING', label: 'Pending' },
                          ]
                      }
                      disabled={conversation.status === 'CLOSED' || conversation.status === 'RESOLVED'}
                      className="w-auto min-w-[140px]"
                    />
                  </div>

                  {/* Star icon */}
                  <button
                    type="button"
                    onClick={handleToggleStar}
                    disabled={updatingStar}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200/80 bg-white/95 backdrop-blur-sm text-xs disabled:opacity-50 transition-all duration-300 hover:scale-110 active:scale-95 hover:border-yellow-300 ${conversation.isStarred ? 'text-yellow-400 shadow-md shadow-yellow-400/20' : 'text-gray-400 hover:text-yellow-400'
                      }`}
                    title={conversation.isStarred ? 'Unstar conversation' : 'Star conversation'}
                  >
                    <svg
                      className="w-4 h-4"
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

                  {/* Resolve conversation pill */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`!px-3 !py-1.5 !text-xs rounded-full border border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
                      }`}
                    onClick={handleResolveConversation}
                    disabled={isResolved}
                  >
                    {isResolved ? 'Conversation Resolved' : 'Resolve Conversation'}
                  </Button>

                  {/* Close conversation pill */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`!px-3 !py-1.5 !text-xs rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
                      }`}
                    onClick={handleCloseConversation}
                    disabled={isClosed}
                  >
                    {isClosed ? 'Conversation Closed' : 'Close Conversation'}
                  </Button>
                </div>
              </div>

              {/* Second row: Assigned to */}
              {isAdmin && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
                  <div className="flex-1 min-w-0" />
                  <div
                    className={`text-sm text-gray-700 flex items-center gap-2 transition-all duration-300 ${editingContact ? 'opacity-0 translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
                      }`}
                  >
                    <span>Assigned to:</span>
                    <Select
                      value={conversation.assignedTo ?? null}
                      onChange={async (value) => {
                        if (!value || assigning) return;
                        await handleAssignConversation({ target: { value } } as React.ChangeEvent<HTMLSelectElement>);
                      }}
                      disabled={assigning || staff.length === 0}
                      placeholder={staff.length === 0 ? 'No agents available' : 'Select agent'}
                      options={staff.map((agent) => ({
                        value: agent.id,
                        label: agent.name,
                      }))}
                      className="w-auto min-w-[180px]"
                    />
                  </div>
                </div>
              )}

              {/* Edit contact form and private note full-width below */}
              {editingContact && (
                <form
                  onSubmit={handleSaveContact}
                  className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl"
                >
                  <Input
                    label="Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John – Lagos"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                  <Input
                    label="Phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 8900"
                  />
                  <div className="flex items-end gap-2">
                    <Button type="submit" size="sm" disabled={savingContact}>
                      {savingContact ? 'Saving...' : 'Save contact'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingContact(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {conversation.assignedTo === user?.id && note && (
                <div className="mt-4 max-w-md">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Your private note</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Only you can see this note. Use the note icon next to the input below to update it.
                  </p>
                  <div className="text-sm text-gray-700 whitespace-pre-line bg-yellow-50 border border-yellow-200 rounded-2xl px-3 py-2">
                    {note}
                  </div>
                </div>
              )}

              {/* Shared internal notes for the team */}
            </div>

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50"
            >
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="max-w-3xl mx-auto space-y-4">
                {allMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  allMessages.map((message) => {
                    const isStaff = message.senderType === 'STAFF';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className="max-w-[70%] rounded-2xl px-5 py-3 bg-black text-white"
                        >
                          <p className="text-base leading-relaxed text-white">{message.content}</p>
                          <p className="text-xs mt-2 text-gray-300">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 px-8 py-5 bg-white">
              <div className="max-w-3xl mx-auto space-y-2">
                {isInactiveConversation && (
                  <div className="text-xs text-gray-500">
                    {isResolved
                      ? 'This conversation is resolved. You can no longer send new messages.'
                      : 'This conversation is closed. You can no longer send new messages.'}
                  </div>
                )}
                <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto relative">
                  <div className="flex gap-3 items-start">
                    {/* Internal notes modal trigger */}
                    <button
                      type="button"
                      onClick={() => setShowInternalNotesModal(true)}
                      className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      title="View internal team notes for this conversation"
                    >
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        {/* Clipboard / note stack icon */}
                        <rect
                          x="5"
                          y="4"
                          width="9"
                          height="11"
                          rx="1.5"
                          strokeWidth={1.4}
                        />
                        <path
                          d="M8 3h3.5a1 1 0 0 1 1 1V5"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                        />
                        <path
                          d="M7.5 8h4M7.5 10.5h3"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    {/* Private note toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!conversation || conversation.status === 'CLOSED' || conversation.status === 'RESOLVED') return;
                        if (conversation.assignedTo && conversation.assignedTo !== user?.id) return;
                        if (!isNoteMode) {
                          setNoteDraft(note);
                        }
                        setIsNoteMode(!isNoteMode);
                        setShowMentionList(false);
                        setMentionQuery('');
                      }}
                      className={`mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm transition-colors ${isNoteMode ? 'text-yellow-600 bg-yellow-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      title="Add private note about this contact"
                    >
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                      >
                        {/* Book / notes icon */}
                        <path
                          d="M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5v11A1.5 1.5 0 0 1 13.5 16h-7A1.5 1.5 0 0 0 5 17.5"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 5.5h5M7 8h4M7 10.5h3"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <Input
                      value={isNoteMode ? noteDraft : newMessage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        if (isNoteMode) {
                          setNoteDraft(value);
                          return;
                        }

                        setNewMessage(value);

                        // very lightweight @ mention detection: if user types '@' and we have staff, show list
                        const atIndex = value.lastIndexOf('@');
                        if (atIndex >= 0) {
                          const query = value.slice(atIndex + 1).trim();
                          setMentionQuery(query);
                          setShowMentionList(true);
                        } else {
                          setShowMentionList(false);
                          setMentionQuery('');
                        }

                        // Saved replies: detect last '/' and show suggestions based on shortcut/name
                        const slashIndex = value.lastIndexOf('/');
                        if (slashIndex >= 0 && !value.slice(slashIndex).includes(' ')) {
                          const query = value.slice(slashIndex + 1);
                          setSavedReplyQuery(query);
                          setShowSavedReplies(true);
                        } else {
                          setShowSavedReplies(false);
                          setSavedReplyQuery('');
                        }
                      }}
                      placeholder={
                        isNoteMode
                          ? 'Type a private note about this contact...'
                          : 'Type a message... Use @ to mention another agent.'
                      }
                      className={`flex-1 ${isNoteMode ? 'bg-yellow-50 border-yellow-300 focus:ring-yellow-400' : ''
                        }`}
                      disabled={sending || (isInactiveConversation && !isNoteMode)}
                    />
                    <Button
                      type="submit"
                      disabled={
                        (isNoteMode ? savingNote || !noteDraft.trim() : sending || !newMessage.trim()) ||
                        (isInactiveConversation && !isNoteMode)
                      }
                    >
                      {isNoteMode ? (savingNote ? 'Saving...' : 'Save note') : sending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                  {showMentionList && !isNoteMode && staff.length > 0 && (
                    <div className="absolute bottom-14 left-0 w-64 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg z-10 max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Invite another agent
                      </div>
                      {staff
                        .filter((agent) => {
                          if (!mentionQuery) return true;
                          const q = mentionQuery.toLowerCase();
                          return (
                            agent.name.toLowerCase().includes(q) ||
                            agent.email.toLowerCase().includes(q)
                          );
                        })
                        .map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col"
                            onClick={() => {
                              const atIndex = newMessage.lastIndexOf('@');
                              const base = atIndex >= 0 ? newMessage.slice(0, atIndex) : newMessage;
                              const handle = `@${agent.name}`;
                              setNewMessage(`${base}${handle} `);
                              setShowMentionList(false);
                              setMentionQuery('');
                            }}
                          >
                            <span className="text-gray-900">{agent.name}</span>
                            <span className="text-xs text-gray-500">{agent.email}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {showSavedReplies && !isNoteMode && savedReplies.length > 0 && (
                    <div className="absolute bottom-14 left-0 w-80 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg z-20 max-h-64 overflow-y-auto">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Saved replies
                      </div>
                      {savedReplies
                        .filter((reply) => {
                          if (!savedReplyQuery) return true;
                          const q = savedReplyQuery.toLowerCase();
                          const shortcut = reply.shortcut ?? '';
                          return (
                            shortcut.toLowerCase().includes(q) ||
                            reply.name.toLowerCase().includes(q)
                          );
                        })
                        .map((reply) => (
                          <button
                            key={reply.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => {
                              const value = newMessage;
                              const slashIndex = value.lastIndexOf('/');
                              const base = slashIndex >= 0 ? value.slice(0, slashIndex) : value;
                              setNewMessage(`${base}${reply.body} `);
                              setShowSavedReplies(false);
                              setSavedReplyQuery('');
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate">
                                {reply.name}
                              </span>
                              {reply.shortcut && (
                                <span className="ml-2 text-[11px] text-gray-400 truncate">
                                  {reply.shortcut}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                              {reply.body}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>

      {/* Internal notes modal */}
      {showInternalNotesModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowInternalNotesModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Internal notes</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Shared notes visible to your team for this conversation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInternalNotesModal(false)}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {conversationNotes.length === 0 ? (
                <p className="text-xs text-gray-500">No internal notes yet.</p>
              ) : (
                conversationNotes.map((n) => (
                  <div
                    key={n.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-800">
                        {n.author?.name || 'Team member'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-line">{n.content}</p>
                  </div>
                ))
              )}
            </div>

            <form
              className="pt-2 border-t border-gray-100 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newConversationNote.trim() || savingConversationNote) return;
                try {
                  setSavingConversationNote(true);
                  const created = await api.conversations.createNote(conversationId, {
                    content: newConversationNote.trim(),
                  });
                  setConversationNotes((prev) => [...prev, created]);
                  setNewConversationNote('');
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : 'Failed to add internal note',
                  );
                } finally {
                  setSavingConversationNote(false);
                }
              }}
            >
              <Input
                value={newConversationNote}
                onChange={(e) => setNewConversationNote(e.target.value)}
                placeholder="Add an internal note..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="sm"
                disabled={savingConversationNote || !newConversationNote.trim()}
              >
                {savingConversationNote ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

