'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/components/providers/SocketProvider';
import { ConversationHeader } from '@/components/conversation/ConversationHeader';
import { MessageThread } from '@/components/conversation/MessageThread';
import { MessageComposer } from '@/components/conversation/MessageComposer';
import { CustomerContextPanel } from '@/components/conversation/CustomerContextPanel';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canLoadStaff = !!user; // both admins and agents can see staff list for @-mentions
  const conversationId = params.id as string;
  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<User[]>([]);
  const [assigning, setAssigning] = useState(false);

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
  const [mentionAssigneeId, setMentionAssigneeId] = useState<string | null>(null);
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);

  const [syncingProfile, setSyncingProfile] = useState(false);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  const [panelInitialTab, setPanelInitialTab] = useState<'overview' | 'notes' | 'activity'>('overview');

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages(true);
    }
  }, [conversationId]);

  // Load staff list for admins and agents so they can @-mention colleagues
  useEffect(() => {
    if (!canLoadStaff) return;

    const loadStaff = async () => {
      try {
        const data = await api.staff.list();
        setStaff(data);
      } catch (err) {
        // errors are shown via general error banner if needed
      }
    };

    loadStaff();
  }, [canLoadStaff]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!socket || !conversationId) return;
 
    const eventName = `new_message_${conversationId}`;
    const handleNewMessage = (message: Message) => {
      console.log('RECEIVED new_message via socket:', message);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          console.log('Skipping duplicate message from socket:', message.id);
          return prev;
        }
        console.log('Adding new message from socket to state:', message.id);
        return [...prev, message];
      });
      loadConversation(); // Refresh conversation stats/status
    };

    const noteEventName = `new_note_${conversationId}`;
    const handleNewNote = (note: any) => {
      console.log('RECEIVED new_note via socket:', note);
      setConversationNotes((prev) => {
        if (prev.some(n => n.id === note.id)) return prev;
        return [...prev, note];
      });
    };

    const handleOrgUpdate = () => {
      loadConversation();
    };
 
    socket.on(eventName, handleNewMessage);
    socket.on(noteEventName, handleNewNote);
    socket.on('conversation_updated', handleOrgUpdate);
 
    return () => {
      socket.off(eventName, handleNewMessage);
      socket.off(noteEventName, handleNewNote);
      socket.off('conversation_updated', handleOrgUpdate);
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

  const [activeSiblingConversation, setActiveSiblingConversation] = useState<Conversation | null>(null);

  const loadConversation = async () => {
    try {
      const [conv, customersData, sibling] = await Promise.all([
        api.conversations.get(conversationId).catch(async () => {
          const list = await api.conversations.list();
          return list.find((c) => c.id === conversationId) ?? null;
        }),
        api.customers.list(),
        api.conversations.getActiveSibling(conversationId).catch(() => null),
      ]);
      if (conv) {
        const enrichedConv = {
          ...conv,
          customer: conv.customer ?? customersData.find((c: Customer) => c.id === conv.customerId),
        } as Conversation & { customer?: Customer };
        setConversation(enrichedConv);
      }
      if (sibling && sibling.id !== conversationId) {
        setActiveSiblingConversation(sibling);
      } else {
        setActiveSiblingConversation(null);
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
      console.log(`Loaded ${data.length} messages for conversation ${conversationId}`);
      
      setMessages(prev => {
        // Reconcile server list with existing state to prevent "vanishing" 
        // if the server list is slightly stale or if a socket event arrived first.
        const serverIds = new Set(data.map(m => m.id));
        const merged = [...data];
        
        prev.forEach(msg => {
          if (!serverIds.has(msg.id)) {
            // If it's a very recent message (last 30 seconds), keep it locally 
            // even if the server hasn't returned it in the list yet.
            const ageMs = Date.now() - new Date(msg.createdAt).getTime();
            if (ageMs < 30000) {
              console.log('Keeping local message in state during reconciliation:', msg.id);
              merged.push(msg);
            }
          }
        });
        
        return merged.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
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
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      // If an @-mention has selected a specific assignee, treat this as an internal handoff
      if (mentionAssigneeId) {
        await api.conversations.handoff(conversationId, {
          assigneeId: mentionAssigneeId,
          note: trimmed,
        });
        setNewMessage('');
        setMentionAssigneeId(null);
        await loadConversation();
        // Notes are loaded separately; no customer-facing message is sent
      } else {
        const sent = await api.messages.create(conversationId, { content: trimmed });
        console.log('Message created successfully:', sent);
        setNewMessage('');
        await loadConversation();
        // Update local state immediately with the returned message
        setMessages(prev => {
          if (prev.some(m => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        // Scroll since we just sent one
        scrollToBottom(true);
        // Optionally reload the full list to stay in sync, but the local update should keep it visible
        await loadMessages(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Message may have been persisted with FAILED status on backend; refresh list so user sees it.
      await loadMessages(false);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isNoteMode) {
      if (!noteDraft.trim() || savingNote) return;
      try {
        setSavingNote(true);
        const created = await api.conversations.createNote(conversationId, {
          content: noteDraft.trim(),
        });
        setConversationNotes((prev) => [...prev, created]);
        setIsNoteMode(false);
        setNoteDraft('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add private note');
      } finally {
        setSavingNote(false);
      }
      return;
    }

    if (!conversation || conversation.status === 'CLOSED' || conversation.status === 'RESOLVED') {
      return;
    }

    await sendMessage();
  };

  const handleCloseConversation = async () => {
    if (!confirm('Are you sure you want to close this conversation?')) return;

    try {
      await api.conversations.close(conversationId);
      await loadConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close conversation');
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm('Are you sure you want to PERMANENTLY DELETE this conversation and all its messages? This cannot be undone.')) return;

    try {
      await api.conversations.delete(conversationId);
      router.push('/dashboard/conversations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
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
  const handleSyncProfile = async () => {
    if (!conversation?.customerId || syncingProfile) return;

    setSyncingProfile(true);
    try {
      const updated = await api.meta.syncProfile(conversation.customerId);
      setConversation((prev) => 
        prev ? { ...prev, customer: { ...prev.customer, ...updated } } : prev
      );
      // Also update name in the customers list if needed, but the above is enough for the current view
      console.log('Profile synced successfully:', updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync profile');
    } finally {
      setSyncingProfile(false);
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
      <div className="h-full flex items-center justify-center bg-[#fafafa]">
        <div className="text-sm text-gray-400">Loading conversation…</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Conversation not found</h2>
          <Button onClick={() => router.push('/dashboard/conversations')}>Back to inbox</Button>
        </div>
      </div>
    );
  }

  const isClosed = conversation.status === 'CLOSED';
  const isResolved = conversation.status === 'RESOLVED';
  const isInactiveConversation = isClosed || isResolved;
  const isAssigned = !!conversation.assignedTo;
  const isCurrentAssignee = !!user && conversation.assignedTo === user.id;
  // Sending customer-facing messages:
  // - If assigned: only the assigned agent can send (including when viewer is ADMIN).
  // - If unassigned: only admins can send.
  const canSendMessages =
    !isInactiveConversation &&
    (isAssigned ? isCurrentAssignee : isAdmin);
  const mappedMessages = messages.map((m) => ({ ...m, isNote: false }));
  const mappedNotes = conversationNotes.map((n) => ({
    id: n.id,
    orgId: n.orgId,
    conversationId: n.conversationId,
    senderType: 'STAFF' as const,
    senderId: n.authorId,
    content: n.content,
    createdAt: n.createdAt,
    isNote: true,
    authorName: n.author?.name || 'Agent',
  }));

  const allMessages = [...mappedMessages, ...mappedNotes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const assignedAgentName =
    (conversation.assignedTo && staff.find((s) => s.id === conversation.assignedTo)?.name) ||
    (conversation.assignedTo ? 'another agent' : null);

  const openCustomerPanel = (tab: typeof panelInitialTab = 'overview') => {
    setPanelInitialTab(tab);
    setShowCustomerPanel(true);
  };

  return (
    <div className="h-full flex flex-col bg-white relative">
      <ConversationHeader
        conversation={conversation}
        onOpenCustomerPanel={() => openCustomerPanel('overview')}
      />

      {activeSiblingConversation && (
        <div className="bg-blue-600 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="font-semibold px-2 py-0.5 rounded bg-white/20">Active Thread</span>
            <span>
              {conversation.customer?.name || 'This customer'} has a new active open conversation!
            </span>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/conversations/${activeSiblingConversation.id}`)}
            className="bg-white text-blue-700 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-all shadow-sm"
          >
            Switch to Open Thread →
          </button>
        </div>
      )}

            <MessageThread
              messages={allMessages}
              conversation={conversation}
              staff={staff}
              currentUserName={user?.name}
              error={error}
              scrollContainerRef={scrollContainerRef}
              messagesEndRef={messagesEndRef}
            />

            <MessageComposer
              canSend={canSendMessages || isNoteMode}
              isInactive={isInactiveConversation}
              isNoteMode={isNoteMode}
              newMessage={newMessage}
              noteDraft={noteDraft}
              sending={sending}
              savingNote={savingNote}
              restrictedMessage={
                isAssigned
                  ? `Assigned to ${assignedAgentName}. Only they can reply.`
                  : 'Assign this conversation to reply.'
              }
              inactiveLabel={`This conversation is ${isResolved ? 'resolved' : 'closed'}`}
              staff={staff}
              savedReplies={savedReplies}
              onMessageChange={setNewMessage}
              onNoteDraftChange={setNoteDraft}
              onSubmit={handleFormSubmit}
              onMentionSelect={(agent) => {
                const atIndex = newMessage.lastIndexOf('@');
                const base = atIndex >= 0 ? newMessage.slice(0, atIndex) : newMessage;
                setNewMessage(`${base}@${agent.name} `);
                setMentionAssigneeId(agent.id);
              }}
              onSavedReplySelect={(reply) => {
                const slashIndex = newMessage.lastIndexOf('/');
                const base = slashIndex >= 0 ? newMessage.slice(0, slashIndex) : newMessage;
                setNewMessage(`${base}${reply.body} `);
              }}
              onToggleNoteMode={() => {
                if (isInactiveConversation && !isNoteMode) return;
                if (conversation.assignedTo && conversation.assignedTo !== user?.id && !isNoteMode) return;
                if (!isNoteMode) setNoteDraft(note);
                setIsNoteMode(!isNoteMode);
              }}
              onOpenInternalNotes={() => openCustomerPanel('notes')}
              onOpenMoreActions={() => openCustomerPanel('overview')}
            />

            <CustomerContextPanel
              isOpen={showCustomerPanel}
              onClose={() => setShowCustomerPanel(false)}
              conversation={conversation}
              staff={staff}
              conversationTags={conversationTags}
              availableTags={availableConversationTags}
              conversationNotes={conversationNotes}
              privateNote={note}
              messages={allMessages}
              isAdmin={isAdmin}
              assigning={assigning}
              savingContact={savingContact}
              savingConversationNote={savingConversationNote}
              syncingProfile={syncingProfile}
              contactForm={contactForm}
              newConversationNote={newConversationNote}
              editingContact={editingContact}
              initialTab={panelInitialTab}
              onContactFormChange={setContactForm}
              onSaveContact={handleSaveContact}
              onToggleEditContact={setEditingContact}
              onAssign={async (assigneeId) => {
                if (assigning) return;
                setAssigning(true);
                try {
                  await api.conversations.assign(conversationId, { assigneeId });
                  await loadConversation();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to assign conversation');
                } finally {
                  setAssigning(false);
                }
              }}
              onToggleTag={toggleConversationTag}
              onStatusChange={async (status) => {
                try {
                  await api.conversations.updateStatus(conversationId, { status });
                  setConversation((prev) => (prev ? { ...prev, status } : prev));
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to update status');
                }
              }}
              onResolve={handleResolveConversation}
              onCloseConversation={handleCloseConversation}
              onDelete={handleDeleteConversation}
              onToggleStar={handleToggleStar}
              onSyncProfile={handleSyncProfile}
              onSavePrivateNote={async (content) => {
                await handleSaveNote(content);
              }}
              onNewConversationNoteChange={setNewConversationNote}
              onAddConversationNote={async (e) => {
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
                  setError(err instanceof Error ? err.message : 'Failed to add internal note');
                } finally {
                  setSavingConversationNote(false);
                }
              }}
            />
    </div>
  );
}
