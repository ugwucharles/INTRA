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
              <Button onClick={() => router.push('/dashboard/customers')}>Back to Contacts</Button>
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
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                  <span className="text-xl font-bold text-white">{initial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {customer.name || customer.email || 'Unnamed customer'}
                    </h1>
                    {customer.source === 'FACEBOOK_MESSENGER' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/50">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.356 2 1.77 6.136 1.77 11.233c0 2.923 1.458 5.485 3.737 7.15V22l3.414-1.879c1.01.278 2.062.435 3.16.435 5.644 0 10.23-4.135 10.23-9.233S17.644 2 12 2zm1.096 12.396l-2.827-3.02-5.503 3.02 6.045-6.427 2.914 3.02 5.412-3.02-6.041 6.427z"/>
                        </svg>
                        Facebook
                      </span>
                    )}
                    {customer.source === 'INSTAGRAM' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-600 border border-pink-200/50">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                        Instagram
                      </span>
                    )}
                    {customer.source === 'WHATSAPP' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200/50">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
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
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-orange-700 border border-orange-200/50 ios-appear"
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
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        customer.source === 'FACEBOOK_MESSENGER' ? 'bg-blue-50 text-blue-600' :
                        customer.source === 'INSTAGRAM' ? 'bg-pink-50 text-pink-600' :
                        customer.source === 'WHATSAPP' ? 'bg-green-50 text-green-600' :
                        customer.source === 'EMAIL' ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                        {customer.source === 'FACEBOOK_MESSENGER' ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.356 2 1.77 6.136 1.77 11.233c0 2.923 1.458 5.485 3.737 7.15V22l3.414-1.879c1.01.278 2.062.435 3.16.435 5.644 0 10.23-4.135 10.23-9.233S17.644 2 12 2zm1.096 12.396l-2.827-3.02-5.503 3.02 6.045-6.427 2.914 3.02 5.412-3.02-6.041 6.427z"/>
                          </svg>
                        ) : customer.source === 'INSTAGRAM' ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                        ) : customer.source === 'WHATSAPP' ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        ) : customer.source === 'EMAIL' ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Source</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {customer.source === 'FACEBOOK_MESSENGER'
                            ? 'Facebook Messenger'
                            : customer.source === 'INSTAGRAM'
                              ? 'Instagram'
                              : customer.source === 'WHATSAPP'
                                ? 'WhatsApp'
                                : customer.source === 'EMAIL'
                                  ? 'Email'
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
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/30'
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
                      className="w-full border border-gray-200/80 rounded-2xl px-4 py-3 text-sm min-h-[100px] bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-200 placeholder:text-gray-400"
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
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border shadow-sm ${conv.status === 'OPEN'
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
                                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/50 shadow-sm">
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
                                        : customer.source === 'WHATSAPP'
                                          ? 'WhatsApp'
                                          : customer.source === 'EMAIL'
                                            ? 'Email'
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
