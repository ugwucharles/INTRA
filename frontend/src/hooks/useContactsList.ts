'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, Customer } from '@/lib/api';

export type ContactChannelFilter = 'all' | 'social' | 'email';

export function useContactsList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ContactChannelFilter>('all');

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.customers.list();
      setCustomers(data.filter((c) => c.isSaved ?? true));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      if (channelFilter === 'social') {
        const social =
          c.source === 'FACEBOOK_MESSENGER' ||
          c.source === 'INSTAGRAM' ||
          c.source === 'WHATSAPP';
        if (!social) return false;
      }

      if (!q) return true;
      const haystack = [c.name, c.email, c.phone].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [customers, searchQuery, channelFilter]);

  return {
    customers: filteredCustomers,
    totalCount: customers.length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    channelFilter,
    setChannelFilter,
    reload: loadCustomers,
  };
}
