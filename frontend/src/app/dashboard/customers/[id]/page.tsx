'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, Customer, Conversation, Tag, CustomerNote, Department } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface CustomerWithMeta extends Customer {
  tags?: Tag[];
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerWithMeta | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customerTags, setCustomerTags] = useState<Tag[]>([]);
  const [allCustomerTags, setAllCustomerTags] = useState<Tag[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        setCustomer({ ...cust, tags });
        setCustomerTags(tags);
        setAllCustomerTags(allTags);
        setDepartments(depts);

        const relatedConversations = convs.filter((c) => c.customerId === customerId);
        setConversations(relatedConversations);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      load();
    }
  }, [customerId]);

  // Load private note for this customer (per-agent)
  useEffect(() => {
    if (!customer || !user || noteLoaded) return;

    const fetchNote = async () => {
      try {
        const res = await api.customers.getNote(customer.id);
        setNote(res.content ?? '');
        setNoteDraft(res.content ?? '');
      } catch {
        // ignore; optional
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
      setCustomer((prev) => (prev ? { ...prev, tags: updated } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || savingNote) return;
    const content = noteDraft.trim();
    try {
      setSavingNote(true);
      const res: CustomerNote = await api.customers.saveNote(customer.id, { content });
      setNote(res.content ?? '');
      setNoteDraft(res.content ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading customer...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!customer) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer not found</h2>
              <Button onClick={() => router.push('/dashboard/customers')}>Back to Customers</Button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const initial = (customer.name || customer.email || '?').charAt(0).toUpperCase();

  const totalConversations = conversations.length;
  const openCount = conversations.filter((c) => c.status === 'OPEN').length;
  const pendingCount = conversations.filter((c) => c.status === 'PENDING').length;
  const closedCount = conversations.filter((c) => c.status === 'CLOSED').length;
  const lastContactAt =
    conversations.length > 0
      ? new Date(
          Math.max(...conversations.map((c) => new Date(c.updatedAt).getTime())),
        )
      : null;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full flex flex-col bg-white">
          <div className="border-b border-gray-200/80 px-8 py-6 ios-appear bg-white/95 backdrop-blur-xl">
            <div className="flex items-center gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/customers')}
                className="!p-2 flex-shrink-0 hover:bg-gray-100/80 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                  <span className="text-xl font-bold text-white">{initial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {customer.name || customer.email || 'Unnamed customer'}
                    </h1>
                    {customer.source === 'FACEBOOK_MESSENGER' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/50">
                        Facebook
                      </span>
                    )}
                    {customer.source === 'INSTAGRAM' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200/50">
                        Instagram
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    {customer.email && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>
                  {customerTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {customerTags.map((tag, index) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50 ios-appear"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl text-sm text-red-700 shadow-sm ios-appear">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: profile + tags + private note */}
              <div className="space-y-6 lg:col-span-1">
                <Card className="p-6 ios-appear ios-stagger-1">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Customer Details</h3>
                  <div className="space-y-3">
                    {customer.name && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Name</div>
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                        </div>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Email</div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{customer.email}</div>
                        </div>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Phone</div>
                          <div className="text-sm font-semibold text-gray-900">{customer.phone}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Source</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {customer.source === 'FACEBOOK_MESSENGER'
                            ? 'Facebook Messenger'
                            : customer.source === 'INSTAGRAM'
                            ? 'Instagram'
                            : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Created</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(customer.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 ios-appear ios-stagger-2">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Tags</h3>
                  {allCustomerTags.length === 0 ? (
                    <p className="text-sm text-gray-500">No tags defined yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allCustomerTags.map((tag, index) => {
                        const active = customerTags.some((t) => t.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag.id)}
                            className={`
                              inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border
                              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                              hover:scale-105 active:scale-95
                              ${active
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                                : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
                              }
                            `}
                            style={{
                              animationDelay: `${index * 0.03}s`,
                            }}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card className="p-6 ios-appear ios-stagger-3">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Private Note</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Only you can see this note. It is shared across all conversations with this customer.
                  </p>
                  <form onSubmit={handleSaveNote} className="space-y-3">
                    <textarea
                      className="w-full border border-gray-200/80 rounded-2xl px-4 py-3 text-sm min-h-[100px] bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200 placeholder:text-gray-400"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Add a private note about this customer..."
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm" disabled={savingNote}>
                        {savingNote ? 'Saving...' : 'Save Note'}
                      </Button>
                    </div>
                  </form>
                  {note && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Last Saved</div>
                      <div className="text-sm text-gray-700 whitespace-pre-line bg-yellow-50/80 border border-yellow-200/50 rounded-2xl px-4 py-3 backdrop-blur-sm">
                        {note}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right column: conversation history */}
              <div className="lg:col-span-2">
                <Card className="p-6 ios-appear">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {totalConversations}
                      </span>
                      <span className="text-sm text-gray-600 font-medium">Conversations</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm">
                        Open {openCount}
                      </span>
                      <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 shadow-sm">
                        Pending {pendingCount}
                      </span>
                      <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200/50 shadow-sm">
                        Closed {closedCount}
                      </span>
                    </div>
                    {lastContactAt && (
                      <div className="text-xs text-gray-500 font-medium">
                        Last contact {lastContactAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-4">Conversation History</h3>
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">No conversations yet with this customer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations
                        .sort(
                          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                        )
                        .map((conv, index) => {
                          const dept = departments.find((d) => d.id === conv.departmentId);
                          return (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => router.push(`/dashboard/conversations/${conv.id}`)}
                              className="w-full text-left bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl px-5 py-4 text-sm hover:bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ios-appear ios-hover-lift active:scale-[0.98]"
                              style={{
                                animationDelay: `${index * 0.05}s`,
                              }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border shadow-sm ${
                                      conv.status === 'OPEN'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                        : conv.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                        : 'bg-gray-50 text-gray-600 border-gray-200/50'
                                    }`}
                                  >
                                    {conv.status === 'OPEN'
                                      ? 'Open'
                                      : conv.status === 'PENDING'
                                      ? 'Pending'
                                      : 'Closed'}
                                  </span>
                                  {dept && (
                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50 shadow-sm">
                                      {dept.name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 font-medium">
                                  {new Date(conv.updatedAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">ID: {conv.id.slice(0, 8)}...</span>
                                {customer.source && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/50">
                                    {customer.source === 'FACEBOOK_MESSENGER'
                                      ? 'Facebook'
                                      : customer.source === 'INSTAGRAM'
                                      ? 'Instagram'
                                      : 'Unknown'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
