'use client';

import React, { useEffect, useState } from 'react';
import { api, RoutingSettings, RouteTo, FallbackBehavior } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Switch } from '@/components/ui/Switch';
import { useAuth } from '@/contexts/AuthContext';

export default function RoutingRulesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [routingSettings, setRoutingSettings] = useState<RoutingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const settings = await api.routing.getSettings();
        setRoutingSettings(settings);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load routing settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingSettings || savingSettings) return;

    setSavingSettings(true);
    try {
      const updated = await api.routing.updateSettings({
        autoRoutingEnabled: routingSettings.autoRoutingEnabled,
        routeTo: routingSettings.routeTo,
        fallbackBehavior: routingSettings.fallbackBehavior,
        afterHoursConfig: routingSettings.afterHoursConfig,
        metadata: routingSettings.metadata,
      });
      setRoutingSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save routing settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Only admins can view routing settings.</div>
      </div>
    );
  }

  if (loading || !routingSettings) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading routing rules...</div>
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
          <h2 className="text-lg font-semibold text-gray-900">Routing behavior</h2>
          <p className="mt-1 text-sm text-gray-600">
            Control how new conversations are routed and which questions are asked upfront.
          </p>
        </div>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start justify-between rounded-xl border border-gray-200/80 bg-white/50 backdrop-blur-sm px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 ios-appear ios-stagger-1">
              <div className="text-sm text-gray-800 pr-4">
                <p className="font-medium">Automatic routing</p>
                <p className="text-xs text-gray-500 mt-1">
                  Assign new conversations to agents automatically based on your rules.
                </p>
              </div>
              <Switch
                checked={routingSettings.autoRoutingEnabled}
                onCheckedChange={(value) =>
                  setRoutingSettings({
                    ...routingSettings,
                    autoRoutingEnabled: value,
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between rounded-xl border border-gray-200/80 bg-white/50 backdrop-blur-sm px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 ios-appear ios-stagger-2">
              <div className="text-sm text-gray-800 pr-4">
                <p className="font-medium">First-message auto reply</p>
                <p className="text-xs text-gray-500 mt-1">
                  Send a greeting automatically when a customer first writes in.
                </p>
              </div>
              <Switch
                checked={(routingSettings.metadata as any)?.sendFirstMessage ?? true}
                onCheckedChange={(value) =>
                  setRoutingSettings({
                    ...routingSettings,
                    metadata: {
                      ...(routingSettings.metadata ?? {}),
                      sendFirstMessage: value,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between rounded-xl border border-gray-200/80 bg-white/50 backdrop-blur-sm px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 ios-appear ios-stagger-3">
              <div className="text-sm text-gray-800 pr-4">
                <p className="font-medium">Ask for department</p>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically ask which department the customer wants to talk to.
                </p>
              </div>
              <Switch
                checked={(routingSettings.metadata as any)?.sendDepartmentQuestion ?? true}
                onCheckedChange={(value) =>
                  setRoutingSettings({
                    ...routingSettings,
                    metadata: {
                      ...(routingSettings.metadata ?? {}),
                      sendDepartmentQuestion: value,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between rounded-xl border border-gray-200/80 bg-white/50 backdrop-blur-sm px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all duration-200 ios-appear ios-stagger-4">
              <div className="text-sm text-gray-800 pr-4">
                <p className="font-medium">Re-ask on invalid reply</p>
                <p className="text-xs text-gray-500 mt-1">
                  If the customer replies with an invalid choice, send the department question again.
                </p>
              </div>
              <Switch
                checked={(routingSettings.metadata as any)?.reaskOnInvalidSelection ?? true}
                onCheckedChange={(value) =>
                  setRoutingSettings({
                    ...routingSettings,
                    metadata: {
                      ...(routingSettings.metadata ?? {}),
                      reaskOnInvalidSelection: value,
                    },
                  })
                }
              />
            </div>
          </div>

          <Card className="p-5 bg-gray-50 border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment rules</h3>
            <div className="space-y-4">
              <SearchableSelect
                label="Route conversations to"
                value={routingSettings.routeTo}
                onChange={(val) =>
                  setRoutingSettings({
                    ...routingSettings,
                    routeTo: val as RouteTo,
                  })
                }
                options={[
                  {
                    value: 'LIVE_AGENTS_ONLY',
                    label: 'Live agents only',
                    description: 'Only route to agents who are currently online.',
                  },
                  {
                    value: 'OFFLINE_ALLOWED',
                    label: 'Live and offline agents',
                    description: 'Allow assignment to agents even if they appear offline.',
                  },
                ]}
              />

              <SearchableSelect
                label="Fallback when no agent is available"
                value={routingSettings.fallbackBehavior}
                onChange={(val) =>
                  setRoutingSettings({
                    ...routingSettings,
                    fallbackBehavior: val as FallbackBehavior,
                  })
                }
                options={[
                  {
                    value: 'NONE',
                    label: 'Do nothing',
                    description: 'Leave the conversation unassigned.',
                  },
                  {
                    value: 'ASSIGN_ANY_AGENT',
                    label: 'Assign any available agent',
                    description: 'Pick any agent who can take the conversation.',
                  },
                  {
                    value: 'ASSIGN_ADMIN',
                    label: 'Assign an admin',
                    description: 'Fallback to an administrator when routing fails.',
                  },
                ]}
              />
            </div>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save routing rules'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
