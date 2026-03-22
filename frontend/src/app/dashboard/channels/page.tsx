'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { api, SocialAccount, SocialChannel } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type ChannelField = {
  name: keyof ChannelFormState;
  label: string;
  placeholder: string;
  required?: boolean;
};

const CHANNELS: {
  key: SocialChannel;
  label: string;
  description: string;
  fields: ChannelField[];
}[] = [
  {
    key: 'FACEBOOK_MESSENGER',
    label: 'Facebook Messenger',
    description: 'Connect a Facebook Page to receive and reply to Messenger chats.',
    fields: [
      { name: 'displayName', label: 'Display Name', placeholder: 'My Facebook Page' },
      { name: 'pageId', label: 'Page ID', placeholder: '123456789', required: true },
      { name: 'accessToken', label: 'Page Access Token', placeholder: 'EAAxxxx...', required: true },
      { name: 'appSecret', label: 'App Secret (optional)', placeholder: 'Optional override' },
    ],
  },
  {
    key: 'INSTAGRAM',
    label: 'Instagram',
    description: 'Connect an Instagram Business account for DMs.',
    fields: [
      { name: 'displayName', label: 'Display Name', placeholder: '@mybusiness' },
      {
        name: 'pageId',
        label: 'Instagram Business Account ID',
        placeholder: '987654321',
        required: true,
      },
      { name: 'accessToken', label: 'Access Token', placeholder: 'EAAxxxx...', required: true },
      { name: 'appSecret', label: 'App Secret (optional)', placeholder: 'Optional override' },
    ],
  },
  {
    key: 'WHATSAPP',
    label: 'WhatsApp',
    description: 'Connect your WhatsApp Business Cloud API number.',
    fields: [
      { name: 'displayName', label: 'Display Name', placeholder: 'Support line' },
      { name: 'phoneNumberId', label: 'Phone Number ID', placeholder: '105720...', required: true },
      { name: 'accessToken', label: 'Access Token', placeholder: 'EAAxxxx...', required: true },
      {
        name: 'pageId',
        label: 'WhatsApp Business Account ID (optional)',
        placeholder: 'Used for routing',
      },
    ],
  },
  {
    key: 'EMAIL',
    label: 'Email',
    description: 'Use email as an inbound/outbound support channel.',
    fields: [
      { name: 'displayName', label: 'Display Name', placeholder: 'Support Inbox' },
      { name: 'pageId', label: 'Inbox Address', placeholder: 'support@yourdomain.com', required: true },
      { name: 'accessToken', label: 'Access Token or API Key', placeholder: 'smtp/api token', required: true },
    ],
  },
];

interface ChannelFormState {
  displayName: string;
  pageId: string;
  accessToken: string;
  appSecret: string;
  phoneNumberId: string;
}

const EMPTY_FORM: ChannelFormState = {
  displayName: '',
  pageId: '',
  accessToken: '',
  appSecret: '',
  phoneNumberId: '',
};

export default function ChannelsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChannel, setActiveChannel] = useState<SocialChannel | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<SocialChannel | null>(null);
  const [connectStatus, setConnectStatus] = useState<string | null>(null);
  const [connectErrorMsg, setConnectErrorMsg] = useState<string | null>(null);
  const [connectedChannel, setConnectedChannel] = useState<string | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  const loadAccounts = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await api.socialAccounts.list();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = new URLSearchParams(window.location.search);
    setConnectStatus(query.get('connect'));
    setConnectedChannel(query.get('channel'));
    setConnectErrorMsg(query.get('msg'));
  }, []);

  const openModal = (channel: SocialChannel) => {
    const existing = accounts.find((a) => a.channel === channel);
    if (existing) {
      setEditingId(existing.id);
      setForm({
        displayName: existing.displayName ?? '',
        pageId: existing.pageId ?? '',
        accessToken: existing.accessToken ?? '',
        appSecret: existing.appSecret ?? '',
        phoneNumberId: existing.phoneNumberId ?? '',
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setActiveChannel(channel);
  };

  const closeModal = () => {
    setActiveChannel(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const saveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel) return;
    setSaving(true);
    try {
      const payload = {
        displayName: form.displayName || undefined,
        accessToken: form.accessToken || '',
        pageId: form.pageId || undefined,
        appSecret: form.appSecret || undefined,
        phoneNumberId: form.phoneNumberId || undefined,
      };

      if (editingId) {
        await api.socialAccounts.update(editingId, payload);
      } else {
        await api.socialAccounts.create({
          channel: activeChannel,
          ...payload,
          accessToken: payload.accessToken,
        });
      }

      await loadAccounts();
      closeModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save channel');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this channel?')) return;
    try {
      await api.socialAccounts.remove(id);
      await loadAccounts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to disconnect');
    }
  };

  const isOauthChannel = (channel: SocialChannel) =>
    channel === 'FACEBOOK_MESSENGER' || channel === 'INSTAGRAM';

  const startOauthConnect = async (channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM') => {
    setOauthLoading(channel);
    try {
      const { url } = await api.socialAccounts.oauthUrl(channel);
      window.location.href = url;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start OAuth');
      setOauthLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
            <p className="text-gray-500 mt-2">Only admins can manage channel connections.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full overflow-y-auto bg-[#FFFCF1]/50">
          <div className="px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Channels</h1>
            <p className="text-gray-500 mt-1">Link Facebook, Instagram, WhatsApp, Email, and more.</p>
            {connectStatus === 'success' && (
              <div className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                {connectedChannel ? `${connectedChannel} connected successfully.` : 'Channel connected successfully.'}
              </div>
            )}
            {connectStatus === 'error' && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {connectErrorMsg || 'Failed to connect channel. Please try again.'}
              </div>
            )}
          </div>

          <div className="px-8 pb-10">
            {loading ? (
              <p className="text-sm text-gray-400">Loading channels...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CHANNELS.map((channel) => {
                  const connected = accounts.find((a) => a.channel === channel.key);
                  return (
                    <Card key={channel.key} className="p-6 border border-gray-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">{channel.label}</h2>
                          <p className="text-sm text-gray-500 mt-1">{channel.description}</p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-3 min-h-4">
                        {connected ? connected.displayName || connected.pageId || 'Connected account' : 'No account linked yet'}
                      </p>

                      <div className="flex gap-2 mt-5">
                        {isOauthChannel(channel.key) ? (
                          <Button
                            type="button"
                            className="flex-1"
                            onClick={() => startOauthConnect(channel.key as 'FACEBOOK_MESSENGER' | 'INSTAGRAM')}
                            disabled={oauthLoading === channel.key}
                          >
                            {oauthLoading === channel.key
                              ? 'Redirecting...'
                              : connected
                                ? 'Reconnect'
                                : 'Connect with Facebook'}
                          </Button>
                        ) : (
                          <Button type="button" className="flex-1" onClick={() => openModal(channel.key)}>
                            {connected ? 'Edit' : 'Connect'}
                          </Button>
                        )}
                        {connected && (
                          <button
                            type="button"
                            onClick={() => disconnect(connected.id)}
                            className="px-4 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {activeChannel && (() => {
          const selected = CHANNELS.find((c) => c.key === activeChannel)!;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">{editingId ? 'Edit' : 'Connect'} {selected.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Credentials are stored per organisation.</p>
                  </div>
                  <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={closeModal}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={saveChannel} className="px-6 py-5 space-y-4">
                  {selected.fields.map((field) => (
                    <Input
                      key={field.name}
                      label={field.label}
                      placeholder={field.placeholder}
                      required={field.required}
                      value={form[field.name]}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    />
                  ))}

                  <div className="flex gap-3 pt-2">
                    <Button type="button" onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Save' : 'Connect'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
