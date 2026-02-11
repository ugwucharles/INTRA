'use client';

import React, { useEffect, useState } from 'react';
import { api, AutoReply, AutoReplyTrigger, RoutingSettings } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export default function RoutingAutoRepliesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [autoReplyDrafts, setAutoReplyDrafts] = useState<Record<AutoReplyTrigger, string>>({
    FIRST_MESSAGE: '',
    DEPARTMENT_SELECTION: '',
    NO_AGENT_AVAILABLE: '',
    AFTER_HOURS: '',
  });
  const [routingSettings, setRoutingSettings] = useState<RoutingSettings | null>(null);
  const [savingReplyFor, setSavingReplyFor] = useState<AutoReplyTrigger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const [settings, replies] = await Promise.all([
          api.routing.getSettings(),
          api.routing.listAutoReplies(),
        ]);
        setRoutingSettings(settings);
        setAutoReplies(replies);

        const initialDrafts: Record<AutoReplyTrigger, string> = {
          FIRST_MESSAGE: '',
          DEPARTMENT_SELECTION: '',
          NO_AGENT_AVAILABLE: '',
          AFTER_HOURS: '',
        };
        (['FIRST_MESSAGE', 'DEPARTMENT_SELECTION', 'NO_AGENT_AVAILABLE', 'AFTER_HOURS'] as AutoReplyTrigger[]).forEach(
          (trigger) => {
            const existing = replies.find(
              (r) => r.trigger === trigger && (r.departmentId === null || r.departmentId === undefined),
            );
            if (existing) {
              initialDrafts[trigger] = existing.message;
            }
          },
        );
        setAutoReplyDrafts(initialDrafts);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load auto replies');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handleSaveAutoReply = async (trigger: AutoReplyTrigger) => {
    if (!routingSettings || savingReplyFor) return;

    const message = autoReplyDrafts[trigger].trim();
    setSavingReplyFor(trigger);
    try {
      const existing = autoReplies.find(
        (r) => r.trigger === trigger && (r.departmentId === null || r.departmentId === undefined),
      );

      let saved: AutoReply;
      if (existing) {
        saved = await api.routing.updateAutoReply(existing.id, { message, isActive: message !== '' });
      } else {
        saved = await api.routing.createAutoReply({ trigger, message });
      }

      const updatedReplies = await api.routing.listAutoReplies();
      setAutoReplies(updatedReplies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save auto reply');
    } finally {
      setSavingReplyFor(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Only admins can view routing settings.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading auto replies...</div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 ios-appear">
          {error}
        </div>
      )}

      <Card className="p-6 ios-appear">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Auto replies</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure automatic messages sent to customers at key moments. Leave a field blank to disable that auto reply.
          </p>
        </div>

        <div className="space-y-6">
          {([
            'FIRST_MESSAGE',
            'DEPARTMENT_SELECTION',
            'NO_AGENT_AVAILABLE',
            'AFTER_HOURS',
          ] as AutoReplyTrigger[]).map((trigger, index) => (
            <div 
              key={trigger} 
              className={`${index > 0 ? 'pt-4 border-t border-gray-100' : ''} ios-appear`}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {trigger === 'FIRST_MESSAGE' && 'First message'}
                    {trigger === 'DEPARTMENT_SELECTION' && 'After department selection'}
                    {trigger === 'NO_AGENT_AVAILABLE' && 'No agent available'}
                    {trigger === 'AFTER_HOURS' && 'After hours'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    {trigger === 'FIRST_MESSAGE' && 'Sent when a new conversation starts.'}
                    {trigger === 'DEPARTMENT_SELECTION' && 'Sent after the customer chooses a department.'}
                    {trigger === 'NO_AGENT_AVAILABLE' && 'Sent if no agent can be assigned by routing.'}
                    {trigger === 'AFTER_HOURS' && 'Sent when messages arrive outside working hours (based on your policy).'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingReplyFor === trigger}
                  onClick={() => handleSaveAutoReply(trigger)}
                >
                  {savingReplyFor === trigger ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <textarea
                className="w-full border border-gray-200/80 rounded-xl px-3 py-2 text-sm min-h-[96px] bg-white/95 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                value={autoReplyDrafts[trigger]}
                onChange={(e) =>
                  setAutoReplyDrafts((prev) => ({
                    ...prev,
                    [trigger]: e.target.value,
                  }))
                }
                placeholder="Enter the message to send for this trigger..."
              />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
