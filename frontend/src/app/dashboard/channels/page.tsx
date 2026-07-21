'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPageShell } from '@/components/Layout/DashboardPageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, SocialAccount, SocialChannel } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getChannelLabel, getChannelColor } from '@/components/conversation/channelUtils';

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
  const [error, setError] = useState('');
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
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save channel');
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this channel?')) return;
    try {
      await api.socialAccounts.remove(id);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const isOauthChannel = (channel: SocialChannel) =>
    channel === 'FACEBOOK_MESSENGER' || channel === 'INSTAGRAM';

  const startOauthConnect = async (channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM') => {
    setOauthLoading(channel);
    try {
      const { url } = await api.socialAccounts.oauthUrl(channel);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth');
      setOauthLoading(null);
    }
  };

  const repairChannel = async (id: string) => {
    setLoading(true);
    try {
      await api.socialAccounts.repair(id);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to repair connection');
    } finally {
      setLoading(false);
    }
  };

  const shell = (content: React.ReactNode) => (
    <ProtectedRoute>
      <DashboardLayout>{content}</DashboardLayout>
    </ProtectedRoute>
  );

  if (!isAdmin) {
    return shell(
      <DashboardPageShell title="Channels" description="Only admins can manage channel connections.">
        <div />
      </DashboardPageShell>,
    );
  }

  const selected = activeChannel ? CHANNELS.find((c) => c.key === activeChannel) : null;

  return shell(
    <>
      <DashboardPageShell
        title="Channels"
        description="Connect Facebook, Instagram, WhatsApp, and email to your inbox."
        maxWidth="4xl"
      >
        {connectStatus === 'success' && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {connectedChannel ? `${connectedChannel} connected successfully.` : 'Channel connected successfully.'}
          </div>
        )}
        {connectStatus === 'error' && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {connectErrorMsg || 'Failed to connect channel. Please try again.'}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
        )}

        {loading && accounts.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading channels…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHANNELS.map((channel) => {
              const connected = accounts.find((a) => a.channel === channel.key);
              const colorClass = getChannelColor(channel.key);
              return (
                <div
                  key={channel.key}
                  className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-4 flex flex-col"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${colorClass}`}
                    >
                      {getChannelLabel(channel.key) ?? channel.label}
                    </span>
                    <span
                      className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        connected ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold text-gray-900 mt-3">{channel.label}</h2>
                  <p className="text-xs text-gray-500 mt-1 flex-1">{channel.description}</p>

                  <p className="text-xs text-gray-400 mt-2 truncate">
                    {connected
                      ? connected.displayName || connected.pageId || 'Connected account'
                      : 'No account linked'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
                    {isOauthChannel(channel.key) ? (
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 min-w-[120px]"
                        onClick={() => startOauthConnect(channel.key as 'FACEBOOK_MESSENGER' | 'INSTAGRAM')}
                        disabled={oauthLoading === channel.key}
                      >
                        {oauthLoading === channel.key
                          ? 'Redirecting…'
                          : connected
                            ? 'Reconnect'
                            : 'Connect with Meta'}
                      </Button>
                    ) : (
                      <Button type="button" size="sm" className="flex-1 min-w-[120px]" onClick={() => openModal(channel.key)}>
                        {connected ? 'Edit' : 'Connect'}
                      </Button>
                    )}
                    {connected && (
                      <>
                        <button
                          type="button"
                          onClick={() => repairChannel(connected.id)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Repair
                        </button>
                        <button
                          type="button"
                          onClick={() => disconnect(connected.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 ring-1 ring-inset ring-red-100 hover:bg-red-50"
                        >
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardPageShell>

      {activeChannel && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md ring-1 ring-black/[0.06]">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {editingId ? 'Edit' : 'Connect'} {selected.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Credentials are stored per organisation.</p>
              </div>
              <button
                type="button"
                className="ml-auto p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                onClick={closeModal}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={saveChannel} className="px-5 py-4 space-y-3">
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

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="flex-1" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Save' : 'Connect'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>,
  );
}
