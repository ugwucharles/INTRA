'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api, Customer } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useContactsList, ContactChannelFilter } from '@/hooks/useContactsList';
import {
  getCustomerDisplayName,
  getCustomerInitial,
  getChannelLabel,
} from '@/components/conversation/channelUtils';

const CHANNEL_FILTERS: { id: ContactChannelFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'email', label: 'Email' },
];

interface ContactListProps {
  selectedId?: string | null;
}

export function ContactList({ selectedId }: ContactListProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const activeId =
    selectedId ??
    (pathname.startsWith('/dashboard/customers/') && pathname !== '/dashboard/customers'
      ? pathname.split('/').pop() ?? null
      : null);

  const {
    customers,
    totalCount,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    channelFilter,
    setChannelFilter,
    reload,
  } = useContactsList();

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      setFormError('');
      await api.customers.create(formData);
      setFormData({ name: '', email: '', phone: '' });
      setShowAddForm(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Contacts</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 tabular-nums">{totalCount}</span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                  ${
                    showAddForm
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
                aria-label={showAddForm ? 'Cancel add contact' : 'Add contact'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showAddForm ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

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
            placeholder="Search contacts…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white focus:border-gray-300 transition-colors"
          />
        </div>

        <div
          className="mt-3 flex p-1 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
          role="tablist"
          aria-label="Filter contacts by channel"
        >
          {CHANNEL_FILTERS.map((f) => {
            const isActive = channelFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setChannelFilter(f.id)}
                className={`
                  flex-1 py-2 px-2 rounded-[10px] text-[12px] sm:text-[13px] font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {isAdmin && showAddForm && (
          <form onSubmit={handleAddContact} className="mt-3 p-3 rounded-xl bg-gray-50/80 ring-1 ring-inset ring-black/[0.04] space-y-2.5">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 234 567 8900"
            />
            {formError && <p className="text-xs text-red-600">{formError}</p>}
            <Button type="submit" size="sm" disabled={adding} className="w-full">
              {adding ? 'Adding…' : 'Add contact'}
            </Button>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {totalCount === 0 ? 'No contacts yet' : 'No matches'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalCount === 0 ? 'Add a contact to get started' : 'Try a different search or filter'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {customers.map((customer) => (
              <ContactRow key={customer.id} customer={customer} isActive={activeId === customer.id} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ContactRow({ customer, isActive }: { customer: Customer; isActive: boolean }) {
  const displayName = getCustomerDisplayName(customer);
  const initial = getCustomerInitial(customer);
  const channel = getChannelLabel(customer.source);
  const subtitle = customer.email || customer.phone || channel || 'No details';

  return (
    <li>
      <Link
        href={`/dashboard/customers/${customer.id}`}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {customer.avatarUrl ? (
              <img src={customer.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-gray-600">{initial}</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">{displayName}</span>
            <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
              {new Date(customer.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
        </div>

        {channel && (
          <span className="hidden sm:inline-flex flex-shrink-0 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            {channel}
          </span>
        )}
      </Link>
    </li>
  );
}