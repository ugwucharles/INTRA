'use client';

import React, { useEffect, useState } from 'react';
import { api, RoutingSettings } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type AvailabilityPreset = 'ALWAYS_OPEN' | 'WEEKDAYS' | 'CUSTOM';

export default function BusinessAvailabilityPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [routingSettings, setRoutingSettings] = useState<RoutingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preset, setPreset] = useState<AvailabilityPreset>('CUSTOM');
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const load = async () => {
      try {
        setLoading(true);
        const settings = await api.routing.getSettings();
        const currentConfig = (settings.afterHoursConfig as any) ?? {};

        let timezone = currentConfig.timezone as string | undefined;
        if (!timezone && typeof window !== 'undefined') {
          try {
            timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          } catch {
            timezone = undefined;
          }
        }

        const updatedConfig = {
          ...currentConfig,
          ...(timezone ? { timezone } : {}),
        };

        const updatedSettings: RoutingSettings = {
          ...settings,
          afterHoursConfig: updatedConfig,
        };

        const presetFromConfig = (updatedConfig.preset as AvailabilityPreset) || 'CUSTOM';

        setRoutingSettings(updatedSettings);
        setPreset(presetFromConfig);
        setDetectedTimezone(timezone ?? null);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load availability settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handlePresetChange = (next: AvailabilityPreset) => {
    if (!routingSettings) return;
    setPreset(next);
    setRoutingSettings({
      ...routingSettings,
      afterHoursConfig: {
        ...(routingSettings.afterHoursConfig ?? {}),
        preset: next,
        // When always open, disable after-hours behaviour; otherwise enable it.
        enabled: next === 'ALWAYS_OPEN' ? false : true,
      },
    });
  };

  const handleTimeChange = (field: 'openTime' | 'closeTime', value: string) => {
    if (!routingSettings) return;
    setRoutingSettings({
      ...routingSettings,
      afterHoursConfig: {
        ...(routingSettings.afterHoursConfig ?? {}),
        [field]: value,
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingSettings || saving) return;

    setSaving(true);
    try {
      const config = {
        ...(routingSettings.afterHoursConfig ?? {}),
        preset,
        enabled: preset === 'ALWAYS_OPEN' ? false : true,
      };

      const updated = await api.routing.updateSettings({
        afterHoursConfig: config,
        metadata: routingSettings.metadata,
      });
      setRoutingSettings(updated);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Only admins can view availability settings.</div>
      </div>
    );
  }

  if (loading || !routingSettings) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading availability...</div>
      </div>
    );
  }

  const afterHoursConfig = (routingSettings.afterHoursConfig as any) ?? {};
  const openTime = afterHoursConfig.openTime ?? '';
  const closeTime = afterHoursConfig.closeTime ?? '';
  const isAlwaysOpen = preset === 'ALWAYS_OPEN';

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 ios-appear">
          {error}
        </div>
      )}

      <Card className="p-6 space-y-6 ios-appear">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">Business availability</h2>
          <p className="text-sm text-gray-600 max-w-xl">
            Define when your team is considered available. We'll use this to decide when to treat
            messages as after-hours and trigger any related automations.
          </p>
          {detectedTimezone && (
            <p className="text-xs text-gray-500 mt-1">
              Using your local timezone <span className="font-medium">{detectedTimezone}</span>{' '}
              automatically.
            </p>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className={`
                flex flex-col gap-1 rounded-xl border px-3 py-2 text-xs cursor-pointer
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ios-appear ios-stagger-1
                ${
                  preset === 'ALWAYS_OPEN'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                    : 'border-gray-200/80 bg-white/50 backdrop-blur-sm hover:border-gray-300 hover:shadow-md active:scale-[0.98]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  className="h-3 w-3 rounded-full border-gray-300 text-black focus:ring-black"
                  checked={preset === 'ALWAYS_OPEN'}
                  onChange={() => handlePresetChange('ALWAYS_OPEN')}
                />
                <span className="font-medium">24/7</span>
              </div>
              <span className={`mt-1 ${preset === 'ALWAYS_OPEN' ? 'text-gray-100' : 'text-gray-500'}`}>
                Always considered available. We won't send after-hours messages.
              </span>
            </label>

            <label className={`
                flex flex-col gap-1 rounded-xl border px-3 py-2 text-xs cursor-pointer
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ios-appear ios-stagger-2
                ${
                  preset === 'WEEKDAYS'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                    : 'border-gray-200/80 bg-white/50 backdrop-blur-sm hover:border-gray-300 hover:shadow-md active:scale-[0.98]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  className="h-3 w-3 rounded-full border-gray-300 text-black focus:ring-black"
                  checked={preset === 'WEEKDAYS'}
                  onChange={() => handlePresetChange('WEEKDAYS')}
                />
                <span className="font-medium">Weekdays</span>
              </div>
              <span className={`mt-1 ${preset === 'WEEKDAYS' ? 'text-gray-100' : 'text-gray-500'}`}>
                Use business hours Monday–Friday. Weekends are treated as after-hours.
              </span>
            </label>

            <label className={`
                flex flex-col gap-1 rounded-xl border px-3 py-2 text-xs cursor-pointer
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ios-appear ios-stagger-3
                ${
                  preset === 'CUSTOM'
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02]'
                    : 'border-gray-200/80 bg-white/50 backdrop-blur-sm hover:border-gray-300 hover:shadow-md active:scale-[0.98]'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  className="h-3 w-3 rounded-full border-gray-300 text-black focus:ring-black"
                  checked={preset === 'CUSTOM'}
                  onChange={() => handlePresetChange('CUSTOM')}
                />
                <span className="font-medium">Custom</span>
              </div>
              <span className={`mt-1 ${preset === 'CUSTOM' ? 'text-gray-100' : 'text-gray-500'}`}>
                Set your own opening and closing times.
              </span>
            </label>
          </div>

          <Card className="p-4 border border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Opening hours</h3>
                <p className="text-xs text-gray-500 mt-1">
                  We'll compare incoming message times against these hours to decide when something
                  is after-hours.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">Opens at</label>
                <input
                  type="time"
                  className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400"
                  value={openTime}
                  onChange={(e) => handleTimeChange('openTime', e.target.value)}
                  disabled={isAlwaysOpen}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-800 mb-1">Closes at</label>
                <input
                  type="time"
                  className="mt-1 block w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400"
                  value={closeTime}
                  onChange={(e) => handleTimeChange('closeTime', e.target.value)}
                  disabled={isAlwaysOpen}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save availability'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
