'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPageShell } from '@/components/Layout/DashboardPageShell';
import { api, Conversation, Customer, User } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getChannelLabel } from '@/components/conversation/channelUtils';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function channelBarColor(source: string) {
  switch (source) {
    case 'FACEBOOK_MESSENGER':
      return 'bg-blue-500';
    case 'INSTAGRAM':
      return 'bg-pink-500';
    case 'WHATSAPP':
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}

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
  avgRating: string;
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

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: 'emerald' | 'amber' | 'gray' | 'blue';
}) {
  const accentClass = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    gray: 'text-gray-900',
    blue: 'text-blue-600',
  }[accent ?? 'gray'];

  return (
    <div className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 tabular-nums ${accentClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {description && <p className="text-xs text-gray-500 mt-0.5 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

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
        const [convs, customers, staffList] = await Promise.all([
          api.conversations.list(),
          api.customers.list(),
          api.staff.list(),
        ]);

        const enriched: EnrichedConversation[] = convs.map((c) => ({
          ...c,
          customer: customers.find((cu) => cu.id === c.customerId),
        }));
        setConversations(enriched);
        setStaff(staffList);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const kpis = useMemo(() => {
    const total = conversations.length;
    const open = conversations.filter((c) => c.status === 'OPEN').length;
    const pending = conversations.filter((c) => c.status === 'PENDING').length;
    const closed = conversations.filter((c) => c.status === 'CLOSED').length;
    const resolved = conversations.filter((c) => c.status === 'RESOLVED').length;
    const resolutionRate = total > 0 ? Math.round(((closed + resolved) / total) * 100) : 0;
    const escalated = conversations.filter((c) => !c.assignedTo && (c.status === 'OPEN' || c.status === 'PENDING')).length;

    const respondedConvs = conversations.filter((c) => c.firstResponseTime != null);
    let formattedResponseTime = 'N/A';
    if (respondedConvs.length > 0) {
      const avg = Math.round(
        respondedConvs.reduce((acc, c) => acc + (c.firstResponseTime || 0), 0) / respondedConvs.length,
      );
      if (avg < 60) formattedResponseTime = `${avg}s`;
      else if (avg < 3600) formattedResponseTime = `${Math.floor(avg / 60)}m ${avg % 60}s`;
      else formattedResponseTime = `${Math.floor(avg / 3600)}h ${Math.floor((avg % 3600) / 60)}m`;
    }

    return { total, open, pending, closed, resolved, escalated, resolutionRate, formattedResponseTime };
  }, [conversations]);

  const volumeData: DayVolume[] = useMemo(() => {
    return Array.from({ length: range }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (range - 1 - i));
      const count = conversations.filter((c) => isSameDay(new Date(c.createdAt), d)).length;
      return {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullLabel: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count,
      };
    });
  }, [conversations, range]);

  const maxVolume = useMemo(() => Math.max(...volumeData.map((d) => d.count), 1), [volumeData]);

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

  const agentStats: AgentStat[] = useMemo(() => {
    return staff
      .map((agent) => {
        const assigned = conversations.filter((c) => c.assignedTo === agent.id);
        const closed = assigned.filter((c) => c.status === 'CLOSED' || c.status === 'RESOLVED').length;
        const avgRating = (agent as any).ratingCount > 0
          ? ((agent as any).ratingTotal / (agent as any).ratingCount).toFixed(1)
          : '—';
        return {
          agent,
          total: assigned.length,
          open: assigned.filter((c) => c.status === 'OPEN').length,
          pending: assigned.filter((c) => c.status === 'PENDING').length,
          closed,
          resolutionRate: assigned.length > 0 ? Math.round((closed / assigned.length) * 100) : 0,
          avgRating,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [conversations, staff]);

  const maxAgentTotal = useMemo(() => Math.max(...agentStats.map((a) => a.total), 1), [agentStats]);

  const unassignedCount = useMemo(
    () => conversations.filter((c) => !c.assignedTo).length,
    [conversations],
  );

  const shell = (content: React.ReactNode) => (
    <ProtectedRoute>
      <DashboardLayout>{content}</DashboardLayout>
    </ProtectedRoute>
  );

  if (loading) {
    return shell(
      <DashboardPageShell title="Analytics">
        <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
      </DashboardPageShell>,
    );
  }


  const rangeToggle = (
    <div
      className="flex p-1 rounded-xl bg-gray-100/80 ring-1 ring-inset ring-black/[0.04]"
      role="tablist"
      aria-label="Date range"
    >
      {([7, 30] as const).map((r) => (
        <button
          key={r}
          type="button"
          role="tab"
          aria-selected={range === r}
          onClick={() => setRange(r)}
          className={`
            px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-all
            ${range === r ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/[0.06]' : 'text-gray-500 hover:text-gray-700'}
          `}
        >
          {r} days
        </button>
      ))}
    </div>
  );

  return shell(
    <DashboardPageShell
      title="Analytics"
      description="Inbox performance overview"
      actions={rangeToggle}
      maxWidth="6xl"
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          <KpiCard label="Total" value={kpis.total} />
          <KpiCard
            label="Open"
            value={kpis.open}
            accent="emerald"
            sub={kpis.total ? `${Math.round((kpis.open / kpis.total) * 100)}%` : undefined}
          />
          <KpiCard
            label="Pending"
            value={kpis.pending}
            accent="amber"
            sub={kpis.total ? `${Math.round((kpis.pending / kpis.total) * 100)}%` : undefined}
          />
          <KpiCard label="Closed" value={kpis.closed} accent="gray" />
          <KpiCard label="Resolved" value={kpis.resolved} accent="gray" />
          <KpiCard label="Resolved %" value={`${kpis.resolutionRate}%`} accent="emerald" sub="(Closed + Resolved) ÷ Total" />
          <KpiCard label="Avg response" value={kpis.formattedResponseTime} accent="blue" sub="First reply" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Panel title="Conversation volume" description={`New conversations per day — last ${range} days`}>
              <div className="flex items-end gap-1 h-36">
                {volumeData.map((day) => {
                  const heightPct = maxVolume > 0 ? (day.count / maxVolume) * 100 : 0;
                  return (
                    <div key={day.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex z-10">
                        <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap">
                          {day.fullLabel}: {day.count}
                        </div>
                      </div>
                      <div className="w-full flex items-end h-28">
                        <div
                          className="w-full rounded-t-md bg-gray-900 group-hover:bg-gray-700 transition-colors"
                          style={{ height: `${Math.max(heightPct, day.count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      {range <= 14 && (
                        <span className="text-[9px] text-gray-400 truncate w-full text-center">
                          {day.label.split(' ')[1]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {range === 30 && (
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-400">{volumeData[0]?.label}</span>
                  <span className="text-[10px] text-gray-400">{volumeData[14]?.label}</span>
                  <span className="text-[10px] text-gray-400">{volumeData[29]?.label}</span>
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Channels" description="Conversations by source">
            {channelData.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {channelData.map((ch) => (
                  <div key={ch.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {ch.source === 'UNKNOWN' ? 'Unknown' : getChannelLabel(ch.source as Customer['source']) ?? ch.source}
                      </span>
                      <span className="text-xs font-semibold text-gray-900 tabular-nums">
                        {ch.count}
                        <span className="text-gray-400 font-normal ml-1">({ch.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${channelBarColor(ch.source)}`}
                        style={{ width: `${ch.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {kpis.escalated > 0 && (
          <Panel title="Escalated conversations" description="Open or pending conversations with no assigned agent">
            <ul className="divide-y divide-gray-50">
              {conversations
                .filter((c) => !c.assignedTo && (c.status === 'OPEN' || c.status === 'PENDING'))
                .slice(0, 10)
                .map((c) => (
                  <li key={c.id} className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {(c as any).customer?.name || 'Unknown customer'}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()} · {c.status}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                      Unassigned
                    </span>
                  </li>
                ))}
            </ul>
            {kpis.escalated > 10 && (
              <p className="text-xs text-gray-400 mt-3">…and {kpis.escalated - 10} more</p>
            )}
          </Panel>
        )}

        <Panel
          title="Team performance"
          description="All-time stats per agent"
        >
          <div className="flex items-center justify-between -mt-2 mb-3">
            <span />
            {unassignedCount > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {unassignedCount} unassigned
              </span>
            )}
          </div>

          {agentStats.length === 0 ? (
            <p className="text-sm text-gray-400">No staff data yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {agentStats.map((stat) => (
                <li key={stat.agent.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {stat.agent.profilePicture ? (
                        <img src={stat.agent.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-gray-600">
                          {stat.agent.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{stat.agent.name}</p>
                      <p className="text-[11px] text-gray-400 capitalize">{stat.agent.role.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right text-xs tabular-nums">
                      <div>
                        <p className="text-gray-400">Total</p>
                        <p className="font-semibold text-gray-900">{stat.total}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Open</p>
                        <p className="font-semibold text-emerald-600">{stat.open}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Resolved</p>
                        <p className="font-semibold text-gray-500">{stat.closed}</p>
                      </div>
                      <div className="min-w-[40px]">
                        <p className="text-gray-400">Resolution %</p>
                        <p className="font-semibold text-gray-900">{stat.resolutionRate}%</p>
                      </div>
                      <div className="min-w-[40px]">
                        <p className="text-gray-400">Avg Rating</p>
                        <p className="font-semibold text-amber-600">{stat.avgRating}</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full"
                      style={{ width: `${(stat.total / maxAgentTotal) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardPageShell>,
  );
}
