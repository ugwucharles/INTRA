'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api, Conversation, Customer, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function channelLabel(source: string) {
  switch (source) {
    case 'FACEBOOK_MESSENGER': return 'Facebook';
    case 'INSTAGRAM': return 'Instagram';
    case 'WHATSAPP': return 'WhatsApp';
    case 'EMAIL': return 'Email';
    default: return source;
  }
}

function channelColor(source: string) {
  switch (source) {
    case 'FACEBOOK_MESSENGER': return 'bg-blue-500';
    case 'INSTAGRAM': return 'bg-pink-500';
    case 'WHATSAPP': return 'bg-green-500';
    case 'EMAIL': return 'bg-gray-500';
    default: return 'bg-orange-500';
  }
}

// ─── types ───────────────────────────────────────────────────────────────────

interface EnrichedConversation extends Conversation {
  customer?: Customer;
}

interface AgentStat {
  agent: User;
  total: number;
  open: number;
  pending: number;
  closed: number;
  resolutionRate: number;
}

interface ChannelStat {
  source: string;
  count: number;
  pct: number;
}

interface DayVolume {
  label: string;
  fullLabel: string;
  count: number;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState<7 | 30>(7);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let convs, customers, staffList;

        [convs, customers, staffList] = await Promise.all([
            api.conversations.list(),
            api.customers.list(),
            api.staff.list(),
          ]);


        const enriched: EnrichedConversation[] = convs.map((c: any) => ({
          ...c,
          customer: customers.find((cu: any) => cu.id === c.customerId),
        }));
        setConversations(enriched);
        setStaff(staffList as any);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = conversations.length;
    const open = conversations.filter((c) => c.status === 'OPEN').length;
    const pending = conversations.filter((c) => c.status === 'PENDING').length;
    const closed = conversations.filter((c) => c.status === 'CLOSED').length;
    const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    
    // Average Response Time
    const respondedConvs = conversations.filter((c) => c.firstResponseTime != null);
    let avgResponseTimeSeconds = 0;
    if (respondedConvs.length > 0) {
      const sum = respondedConvs.reduce((acc, c) => acc + (c.firstResponseTime || 0), 0);
      avgResponseTimeSeconds = Math.round(sum / respondedConvs.length);
    }
    
    // Format into text, e.g., "1m 30s" or "N/A"
    let formattedResponseTime = "N/A";
    if (respondedConvs.length > 0) {
      if (avgResponseTimeSeconds < 60) {
        formattedResponseTime = `${avgResponseTimeSeconds}s`;
      } else if (avgResponseTimeSeconds < 3600) {
        const mins = Math.floor(avgResponseTimeSeconds / 60);
        const secs = avgResponseTimeSeconds % 60;
        formattedResponseTime = `${mins}m ${secs}s`;
      } else {
        const hours = Math.floor(avgResponseTimeSeconds / 3600);
        const mins = Math.floor((avgResponseTimeSeconds % 3600) / 60);
        formattedResponseTime = `${hours}h ${mins}m`;
      }
    }

    return { total, open, pending, closed, resolutionRate, formattedResponseTime };
  }, [conversations]);

  // ── Volume trends ─────────────────────────────────────────────────────────
  const volumeData: DayVolume[] = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      const count = conversations.filter((c) =>
        isSameDay(new Date(c.createdAt), d),
      ).length;
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count,
      };
    });
  }, [conversations, range]);

  const maxVolume = useMemo(() => Math.max(...volumeData.map((d) => d.count), 1), [volumeData]);

  // ── Channel breakdown ─────────────────────────────────────────────────────
  const channelData: ChannelStat[] = useMemo(() => {
    const map: Record<string, number> = {};
    conversations.forEach((c) => {
      const src = c.customer?.source ?? 'UNKNOWN';
      map[src] = (map[src] ?? 0) + 1;
    });
    const total = conversations.length || 1;
    return Object.entries(map)
      .map(([source, count]) => ({ source, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [conversations]);

  // ── Team performance ──────────────────────────────────────────────────────
  const agentStats: AgentStat[] = useMemo(() => {
    return staff
      .map((agent) => {
        const assigned = conversations.filter((c) => c.assignedTo === agent.id);
        const closed = assigned.filter((c) => c.status === 'CLOSED').length;
        return {
          agent,
          total: assigned.length,
          open: assigned.filter((c) => c.status === 'OPEN').length,
          pending: assigned.filter((c) => c.status === 'PENDING').length,
          closed,
          resolutionRate: assigned.length > 0 ? Math.round((closed / assigned.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [conversations, staff]);

  const maxAgentTotal = useMemo(
    () => Math.max(...agentStats.map((a) => a.total), 1),
    [agentStats],
  );

  const unassignedCount = useMemo(
    () => conversations.filter((c) => !c.assignedTo).length,
    [conversations],
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full overflow-y-auto bg-gray-50">
          <div className="px-8 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-0.5">All-time overview of your inbox performance</p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      range === r
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </div>

            {/* {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )} */}

            {/* ── KPI row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <KpiCard label="Total Conversations" value={kpis.total} color="text-gray-900" />
              <KpiCard label="Open" value={kpis.open} color="text-green-600" sub={kpis.total ? `${Math.round((kpis.open / kpis.total) * 100)}% of total` : undefined} />
              <KpiCard label="Pending" value={kpis.pending} color="text-yellow-600" sub={kpis.total ? `${Math.round((kpis.pending / kpis.total) * 100)}% of total` : undefined} />
              <KpiCard label="Closed" value={kpis.closed} color="text-gray-500" sub={kpis.total ? `${Math.round((kpis.closed / kpis.total) * 100)}% of total` : undefined} />
              <KpiCard label="Resolution Rate" value={`${kpis.resolutionRate}%`} color="text-orange-600" sub="Closed ÷ Total" />
              <KpiCard label="Avg Response" value={kpis.formattedResponseTime} color="text-blue-600" sub="First reply" />
            </div>

            {/* ── Volume trends + Channel breakdown ──────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Volume trends — spans 2 cols */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">
                  Conversation Volume
                </h2>
                <p className="text-xs text-gray-400 mb-6">New conversations per day — last {range} days</p>

                {/* Bar chart */}
                <div className="flex items-end gap-1 h-40">
                  {volumeData.map((day) => {
                    const heightPct = maxVolume > 0 ? (day.count / maxVolume) * 100 : 0;
                    return (
                      <div
                        key={day.label}
                        className="flex-1 flex flex-col items-center gap-1 group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                            {day.fullLabel}: <span className="font-semibold">{day.count}</span>
                          </div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </div>
                        {/* Bar */}
                        <div className="w-full flex items-end" style={{ height: '120px' }}>
                          <div
                            className="w-full rounded-t-md bg-gray-900 transition-all duration-300 group-hover:bg-orange-500"
                            style={{ height: `${Math.max(heightPct, day.count > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        {/* Label */}
                        {range <= 14 && (
                          <span className="text-[9px] text-gray-400 truncate w-full text-center">
                            {day.label.split(' ')[1]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels for 30d: show only first/mid/last */}
                {range === 30 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{volumeData[0]?.label}</span>
                    <span className="text-[10px] text-gray-400">{volumeData[14]?.label}</span>
                    <span className="text-[10px] text-gray-400">{volumeData[29]?.label}</span>
                  </div>
                )}
              </div>

              {/* Channel breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Channel Breakdown</h2>
                <p className="text-xs text-gray-400 mb-6">Conversations by source channel</p>

                {channelData.length === 0 ? (
                  <p className="text-sm text-gray-400">No data yet.</p>
                ) : (
                  <div className="space-y-4">
                    {channelData.map((ch) => (
                      <div key={ch.source}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">
                            {channelLabel(ch.source)}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {ch.count}
                            <span className="text-xs font-normal text-gray-400 ml-1">({ch.pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${channelColor(ch.source)}`}
                            style={{ width: `${ch.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Team Performance ─────────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900">Team Performance</h2>
                {unassignedCount > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                    {unassignedCount} unassigned
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-6">All-time stats per agent</p>

              {agentStats.length === 0 ? (
                <p className="text-sm text-gray-400">No staff data yet.</p>
              ) : (
                <div className="space-y-5">
                  {agentStats.map((stat) => (
                    <div key={stat.agent.id}>
                      {/* Agent header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {stat.agent.profilePicture ? (
                              <img src={stat.agent.profilePicture} alt={stat.agent.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-gray-600">
                                {stat.agent.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{stat.agent.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{stat.agent.role.toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="text-sm font-bold text-gray-900">{stat.total}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Open</p>
                            <p className="text-sm font-bold text-green-600">{stat.open}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Pending</p>
                            <p className="text-sm font-bold text-yellow-600">{stat.pending}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Closed</p>
                            <p className="text-sm font-bold text-gray-500">{stat.closed}</p>
                          </div>
                          <div className="min-w-[52px]">
                            <p className="text-xs text-gray-400">Resolved</p>
                            <p className={`text-sm font-bold ${stat.resolutionRate >= 70 ? 'text-green-600' : stat.resolutionRate >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                              {stat.resolutionRate}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Load bar */}
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-500"
                          style={{ width: `${maxAgentTotal > 0 ? (stat.total / maxAgentTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
