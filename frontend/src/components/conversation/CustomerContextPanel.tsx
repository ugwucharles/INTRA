'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Conversation,
  ConversationNote,
  Tag,
  User,
  Message,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  getCustomerDisplayName,
  getCustomerInitial,
  getChannelLabel,
  getChannelColor,
  formatStatus,
} from './channelUtils';

type PanelTab = 'overview' | 'notes' | 'activity' | 'insights';

interface CustomerContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  staff: User[];
  conversationTags: Tag[];
  availableTags: Tag[];
  conversationNotes: ConversationNote[];
  privateNote: string;
  messages: Message[];
  isAdmin: boolean;
  assigning: boolean;
  savingContact: boolean;
  savingConversationNote: boolean;
  syncingProfile: boolean;
  contactForm: { name: string; email: string; phone: string };
  newConversationNote: string;
  editingContact: boolean;
  initialTab?: PanelTab;
  onContactFormChange: (form: { name: string; email: string; phone: string }) => void;
  onSaveContact: (e: React.FormEvent) => void;
  onToggleEditContact: (editing: boolean) => void;
  onAssign: (assigneeId: string) => void;
  onToggleTag: (tagId: string) => void;
  onStatusChange: (status: 'OPEN' | 'PENDING') => void;
  onResolve: () => void;
  onCloseConversation: () => void;
  onDelete: () => void;
  onToggleStar: () => void;
  onSyncProfile: () => void;
  onSavePrivateNote: (content: string) => void;
  onNewConversationNoteChange: (value: string) => void;
  onAddConversationNote: (e: React.FormEvent) => void;
}

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity' },
  { id: 'insights', label: 'AI Insights' },
];

export function CustomerContextPanel({
  isOpen,
  onClose,
  conversation,
  staff,
  conversationTags,
  availableTags,
  conversationNotes,
  privateNote,
  messages,
  isAdmin,
  assigning,
  savingContact,
  savingConversationNote,
  syncingProfile,
  contactForm,
  newConversationNote,
  editingContact,
  initialTab = 'overview',
  onContactFormChange,
  onSaveContact,
  onToggleEditContact,
  onAssign,
  onToggleTag,
  onStatusChange,
  onResolve,
  onCloseConversation,
  onDelete,
  onToggleStar,
  onSyncProfile,
  onSavePrivateNote,
  onNewConversationNoteChange,
  onAddConversationNote,
}: CustomerContextPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PanelTab>(initialTab);
  const [privateNoteDraft, setPrivateNoteDraft] = useState(privateNote);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    setPrivateNoteDraft(privateNote);
  }, [privateNote]);
  const [savingPrivateNote, setSavingPrivateNote] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const customer = conversation.customer;
  const displayName = getCustomerDisplayName(customer);
  const initial = getCustomerInitial(customer);
  const channel = getChannelLabel(customer?.source);
  const assignedAgent = staff.find((s) => s.id === conversation.assignedTo);

  const handleSavePrivateNote = async () => {
    setSavingPrivateNote(true);
    await onSavePrivateNote(privateNoteDraft);
    setSavingPrivateNote(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:bg-black/10"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel header */}
        <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Customer</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
              {customer?.avatarUrl ? (
                <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-gray-600">{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 truncate">{displayName}</p>
              {channel && (
                <span className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${getChannelColor(customer?.source)}`}>
                  {channel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onToggleStar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title={conversation.isStarred ? 'Unstar' : 'Star'}
            >
              <svg
                className={`w-5 h-5 ${conversation.isStarred ? 'text-amber-400' : 'text-gray-300'}`}
                fill={conversation.isStarred ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-gray-100 px-2">
          <nav className="flex -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-medium text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Contact details */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Details</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onSyncProfile}
                      disabled={syncingProfile}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Sync from Meta"
                    >
                      <svg className={`w-4 h-4 ${syncingProfile ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingContact) {
                          onToggleEditContact(false);
                        } else {
                          onToggleEditContact(true);
                          onContactFormChange({
                            name: customer?.name || '',
                            email: customer?.email || '',
                            phone: customer?.phone || '',
                          });
                        }
                      }}
                      className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {editingContact ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                </div>

                {editingContact ? (
                  <form onSubmit={onSaveContact} className="space-y-3">
                    <Input
                      label="Name"
                      value={contactForm.name}
                      onChange={(e) => onContactFormChange({ ...contactForm, name: e.target.value })}
                      placeholder="Customer name"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => onContactFormChange({ ...contactForm, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                    <Input
                      label="Phone"
                      value={contactForm.phone}
                      onChange={(e) => onContactFormChange({ ...contactForm, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                    />
                    <Button type="submit" size="sm" disabled={savingContact}>
                      {savingContact ? 'Saving…' : 'Save'}
                    </Button>
                  </form>
                ) : (
                  <dl className="space-y-2.5">
                    {customer?.email && (
                      <div>
                        <dt className="text-[11px] text-gray-400">Email</dt>
                        <dd className="text-sm text-gray-900">{customer.email}</dd>
                      </div>
                    )}
                    {customer?.phone && (
                      <div>
                        <dt className="text-[11px] text-gray-400">Phone</dt>
                        <dd className="text-sm text-gray-900">{customer.phone}</dd>
                      </div>
                    )}
                    {!customer?.email && !customer?.phone && (
                      <p className="text-sm text-gray-400">No contact details yet</p>
                    )}
                  </dl>
                )}
              </section>

              {/* Assigned agent */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned to</h3>
                {isAdmin ? (
                  <Select
                    value={conversation.assignedTo ?? null}
                    onChange={(value) => value && onAssign(value)}
                    disabled={assigning || staff.length === 0}
                    placeholder="Unassigned"
                    options={staff.map((agent) => ({ value: agent.id, label: agent.name }))}
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {assignedAgent?.name || 'Unassigned'}
                  </p>
                )}
              </section>

              {/* Tags */}
              {availableTags.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isActive = conversationTags.some((t) => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => onToggleTag(tag.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Metadata */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Conversation</h3>
                <dl className="space-y-2.5">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatStatus(conversation.status)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {conversation.firstResponseTime != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">First response</dt>
                      <dd className="text-sm text-gray-900">
                        {Math.round(conversation.firstResponseTime / 60)}m
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Advanced actions */}
              <section>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Advanced actions
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-2">
                    {conversation.status !== 'CLOSED' && conversation.status !== 'RESOLVED' && (
                      <Select
                        value={conversation.status}
                        onChange={(value) => onStatusChange(value as 'OPEN' | 'PENDING')}
                        options={[
                          { value: 'OPEN', label: 'Open' },
                          { value: 'PENDING', label: 'Pending' },
                        ]}
                      />
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {conversation.status !== 'RESOLVED' && (
                        <Button variant="secondary" size="sm" onClick={onResolve}>
                          Resolve
                        </Button>
                      )}
                      {conversation.status !== 'CLOSED' && (
                        <Button variant="secondary" size="sm" onClick={onCloseConversation}>
                          Close
                        </Button>
                      )}
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={onDelete} className="!text-red-600">
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <button
                type="button"
                onClick={() => customer?.id && router.push(`/dashboard/customers/${customer.id}`)}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-900 py-2 transition-colors"
              >
                View full profile →
              </button>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Private note */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your private note</h3>
                <p className="text-[11px] text-gray-400 mb-3">Only visible to you</p>
                <textarea
                  value={privateNoteDraft}
                  onChange={(e) => setPrivateNoteDraft(e.target.value)}
                  placeholder="Add a private note about this contact…"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white resize-none"
                />
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  disabled={savingPrivateNote || privateNoteDraft === privateNote}
                  onClick={handleSavePrivateNote}
                >
                  {savingPrivateNote ? 'Saving…' : 'Save note'}
                </Button>
              </section>

              {/* Team notes */}
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Team notes</h3>
                <div className="space-y-2 mb-3">
                  {conversationNotes.length === 0 ? (
                    <p className="text-sm text-gray-400">No team notes yet</p>
                  ) : (
                    conversationNotes.map((n) => (
                      <div key={n.id} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {n.author?.name || 'Team member'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={onAddConversationNote} className="flex gap-2">
                  <Input
                    value={newConversationNote}
                    onChange={(e) => onNewConversationNoteChange(e.target.value)}
                    placeholder="Add a team note…"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingConversationNote || !newConversationNote.trim()}
                  >
                    Add
                  </Button>
                </form>
              </section>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent activity</h3>
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet</p>
              ) : (
                <div className="space-y-0">
                  {messages.slice(-20).reverse().map((msg) => (
                    <div key={msg.id} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        msg.senderType === 'STAFF' ? 'bg-gray-900' : 'bg-gray-300'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">
                          {msg.senderType === 'STAFF' ? 'Agent replied' : 'Customer messaged'}
                          <span className="mx-1">·</span>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2 mt-0.5">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  AI-powered conversation analysis will appear here — including sentiment, suggested replies, and conversation summaries.
                </p>
              </div>

              <div className="space-y-3">
                <InsightCard
                  title="Sentiment"
                  value={messages.length > 0 ? 'Neutral' : '—'}
                  description="Based on recent messages"
                />
                <InsightCard
                  title="Suggested reply"
                  value="—"
                  description="AI-generated response suggestions"
                  muted
                />
                <InsightCard
                  title="Summary"
                  value={messages.length > 0 ? `${messages.length} messages` : '—'}
                  description="Conversation overview"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function InsightCard({
  title,
  value,
  description,
  muted,
}: {
  title: string;
  value: string;
  description: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${muted ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100 bg-white'}`}>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-sm font-medium mt-0.5 ${muted ? 'text-gray-400' : 'text-gray-900'}`}>{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}
