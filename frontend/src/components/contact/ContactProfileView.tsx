'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Customer, Conversation, Tag, CustomerNote, Department } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCustomerDisplayName,
  getCustomerInitial,
  getChannelLabel,
  getChannelColor,
  formatStatus,
  formatRelativeTime,
} from '@/components/conversation/channelUtils';

type ProfileTab = 'overview' | 'conversations' | 'notes' | 'tags';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'notes', label: 'Notes' },
  { id: 'tags', label: 'Tags' },
];

interface ContactProfileViewProps {
  customerId: string;
}

export function ContactProfileView({ customerId }: ContactProfileViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customerTags, setCustomerTags] = useState<Tag[]>([]);
  const [allCustomerTags, setAllCustomerTags] = useState<Tag[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  const [note, setNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cust, convs, tags, allTags, depts] = await Promise.all([
          api.customers.get(customerId),
          api.conversations.list(),
          api.customers.listTags(customerId),
          api.tags.list('CUSTOMER'),
          api.departments.list(),
        ]);

        setCustomer(cust);
        setCustomerTags(tags);
        setAllCustomerTags(allTags);
        setDepartments(depts);
        setConversations(convs.filter((c) => c.customerId === customerId));
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      setNoteLoaded(false);
      load();
    }
  }, [customerId]);

  useEffect(() => {
    if (!customer || !user || noteLoaded) return;

    const fetchNote = async () => {
      try {
        const res = await api.customers.getNote(customer.id);
        setNote(res.content ?? '');
        setNoteDraft(res.content ?? '');
      } catch {
        // optional
      } finally {
        setNoteLoaded(true);
      }
    };

    fetchNote();
  }, [customer, user, noteLoaded]);

  const handleToggleTag = async (tagId: string) => {
    if (!customer) return;
    try {
      const hasTag = customerTags.some((t) => t.id === tagId);
      const updated = hasTag
        ? await api.customers.removeTag(customer.id, tagId)
        : await api.customers.addTag(customer.id, { tagId });
      setCustomerTags(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || savingNote) return;
    try {
      setSavingNote(true);
      const res: CustomerNote = await api.customers.saveNote(customer.id, {
        content: noteDraft.trim(),
      });
      setNote(res.content ?? '');
      setNoteDraft(res.content ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteData = async () => {
    if (!customer || !confirm('Delete all data for this contact?')) return;
    try {
      await api.meta.deleteData({ customerId: customer.id });
      router.push('/dashboard/customers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading…</div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Contact not found</h2>
        <Link
          href="/dashboard/customers"
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Back to contacts
        </Link>
      </div>
    );
  }

  const displayName = getCustomerDisplayName(customer);
  const initial = getCustomerInitial(customer);
  const channel = getChannelLabel(customer.source);
  const channelColor = getChannelColor(customer.source);

  const openCount = conversations.filter((c) => c.status === 'OPEN').length;
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/customers"
            className="lg:hidden flex-shrink-0 p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Back to contacts"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {customer.avatarUrl ? (
              <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-gray-600">{initial}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">{displayName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {channel && (
                <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${channelColor}`}>
                  {channel}
                </span>
              )}
              {openCount > 0 && (
                <span className="text-[11px] text-emerald-600 font-medium">{openCount} open</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="mt-3 flex p-1 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
          role="tablist"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count =
              tab.id === 'conversations'
                ? conversations.length
                : tab.id === 'tags'
                  ? customerTags.length
                  : 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-[10px]
                  text-[12px] sm:text-[13px] font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <span className="truncate">{tab.label}</span>
                {count > 0 && (tab.id === 'conversations' || tab.id === 'tags') && (
                  <span
                    className={`text-[10px] tabular-nums ${isActive ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="p-4 space-y-4 max-w-lg">
            <DetailSection title="Contact info">
              <DetailRow label="Name" value={customer.name} />
              <DetailRow label="Email" value={customer.email} />
              <DetailRow label="Phone" value={customer.phone} />
              <DetailRow label="Source" value={channel ?? undefined} />
              <DetailRow
                label="Added"
                value={new Date(customer.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              />
            </DetailSection>

            {customerTags.length > 0 && (
              <DetailSection title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {customerTags.map((tag) => (
                    <TagPill key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                </div>
              </DetailSection>
            )}

            <DetailSection title="Activity">
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Total" value={conversations.length} />
                <StatPill label="Open" value={openCount} accent="emerald" />
                <StatPill
                  label="Closed"
                  value={conversations.filter((c) => c.status === 'CLOSED').length}
                />
              </div>
            </DetailSection>

            {isAdmin &&
              (customer.source === 'FACEBOOK_MESSENGER' ||
                customer.source === 'INSTAGRAM' ||
                customer.source === 'WHATSAPP') && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDeleteData}
                    className="text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    Delete channel data
                  </button>
                </div>
              )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="p-2">
            {sortedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <p className="text-sm text-gray-500">No conversations with this contact yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {sortedConversations.map((conv) => {
                  const dept = departments.find((d) => d.id === conv.departmentId);
                  return (
                    <li key={conv.id}>
                      <Link
                        href={`/dashboard/conversations/${conv.id}`}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            conv.status === 'OPEN'
                              ? 'bg-emerald-500'
                              : conv.status === 'PENDING'
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatStatus(conv.status)}
                            </span>
                            {dept && (
                              <span className="text-[11px] text-gray-400 truncate">{dept.name}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Updated {formatRelativeTime(conv.updatedAt)}
                          </p>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-300 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-4 max-w-lg">
            <p className="text-xs text-gray-500 mb-3">
              Private note — only you can see this. Shared across all conversations with this contact.
            </p>
            <form onSubmit={handleSaveNote} className="space-y-3">
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-h-[120px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white focus:border-gray-300 transition-colors placeholder:text-gray-400"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note about this contact…"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={savingNote}>
                  {savingNote ? 'Saving…' : 'Save note'}
                </Button>
              </div>
            </form>
            {note && note !== noteDraft && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-100 text-sm text-gray-700 whitespace-pre-line">
                {note}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="p-4 max-w-lg">
            {allCustomerTags.length === 0 ? (
              <div className="text-sm text-gray-500 space-y-1">
                <p>No contact tags yet.</p>
                {isAdmin && (
                  <p className="text-xs text-gray-400">
                    Create tags under Routing → Tags (e.g. VIP), then assign them here.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allCustomerTags.map((tag) => {
                  const active = customerTags.some((t) => t.id === tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className={`
                        inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
                        ${
                          active
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color ?? '#6B7280' }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="rounded-xl bg-gray-50/80 ring-1 ring-inset ring-black/[0.04] p-3 space-y-2">
        {children}
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right truncate">{value}</span>
    </div>
  );
}

function TagPill({ name, color }: { name: string; color?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color ?? '#6B7280' }}
      />
      {name}
    </span>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'emerald';
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] px-3 py-2.5 text-center">
      <div
        className={`text-lg font-semibold tabular-nums ${
          accent === 'emerald' ? 'text-emerald-600' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
      <div className="text-[11px] text-gray-500 font-medium">{label}</div>
    </div>
  );
}
