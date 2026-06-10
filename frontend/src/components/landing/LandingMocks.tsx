import React from 'react';

/** Saved replies — a feature INTRA actually has */
export function SavedRepliesMock() {
  return (
    <div className="landing-hover-lift relative mx-auto max-w-[640px]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#ffe8d6] via-transparent to-transparent rounded-[40px] blur-2xl scale-110 opacity-80" />
      <div className="kinso-ambient-shimmer overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] ring-1 ring-amber-100/60">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-neutral-200" />
          <div>
            <p className="text-xs font-semibold text-neutral-900">Customer thread</p>
            <p className="text-[10px] text-neutral-400">WhatsApp</p>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-neutral-100 px-3 py-2 text-xs text-neutral-700">
            Do you offer team pricing?
          </div>
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Saved reply</span>
              <span className="text-[10px] font-mono text-neutral-500">/pricing</span>
            </div>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Hi! Our team plans start at $99/mo. Happy to share a full breakdown — want me to send it over?
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            {['Attach', 'Saved replies', 'Send'].map((a) => (
              <span
                key={a}
                className={`text-[10px] px-2.5 py-1 rounded-lg ${
                  a === 'Send' ? 'bg-neutral-900 text-white ml-auto' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchMock() {
  return (
    <div className="landing-hover-lift relative mx-auto max-w-[640px]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#d4eef5] via-transparent to-transparent rounded-[40px] blur-2xl scale-110 opacity-80" />
      <div className="kinso-ambient-shimmer rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] ring-1 ring-sky-100/70">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 ring-1 ring-neutral-200/60">
          <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm text-neutral-500">refund policy</span>
        </div>
        <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Results</p>
          {[
            { name: 'Sarah K.', ch: 'WhatsApp', snippet: 'Asked about refund for order #8821' },
            { name: 'James O.', ch: 'Email', snippet: 'Return request — attached receipt' },
          ].map((r) => (
            <div key={r.name} className="flex items-start gap-3 py-2.5 border-b border-neutral-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-900">{r.name}</p>
                <p className="text-[10px] text-neutral-400">{r.ch}</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">{r.snippet}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ContextMock() {
  return (
    <div className="landing-hover-lift relative mx-auto max-w-[640px]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#e8dff5] via-transparent to-transparent rounded-[40px] blur-2xl scale-110 opacity-70" />
      <div className="kinso-ambient-shimmer overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] ring-1 ring-violet-100/70">
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-200" />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Natasha Corwin</p>
              <div className="flex gap-1 mt-1">
                {['Messenger', 'Instagram'].map((c) => (
                  <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-1 p-2 bg-neutral-50 border-b border-neutral-100">
          {['Overview', 'Notes', 'Activity'].map((t, i) => (
            <span
              key={t}
              className={`flex-1 text-center text-[10px] font-medium py-1.5 rounded-lg ${
                i === 0 ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="p-4 space-y-3 text-[11px]">
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">VIP</span>
            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">Enterprise</span>
          </div>
          <p className="text-neutral-600 rounded-lg bg-amber-50/80 border border-amber-100 p-2.5">
            Note: Prefers WhatsApp. Mentioned budget review in March.
          </p>
          <p className="text-neutral-400">2 open conversations · Last contact today</p>
        </div>
      </div>
    </div>
  );
}

export function RoutingMock() {
  return (
    <div className="landing-hover-lift relative max-w-[480px] ml-auto">
      <div className="space-y-3">
        {[
          { name: 'Maya Sterling', tag: 'Sales', tagColor: 'bg-emerald-100 text-emerald-800', ch: 'WhatsApp', msg: 'Interested in team pricing for 10 seats.' },
          { name: "Lucas O'Connor", tag: 'Support', tagColor: 'bg-amber-100 text-amber-800', ch: 'Email', msg: 'Order #4421 — where is my shipment?' },
          { name: 'Ethan Rivers', tag: 'Billing', tagColor: 'bg-blue-100 text-blue-800', ch: 'Instagram', msg: 'Can I update my invoice address?' },
        ].map((c) => (
          <div
            key={c.name}
            className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-4 flex gap-3 transition-all duration-300 hover:bg-white/[0.1] hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-full bg-neutral-700 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{c.name}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.tagColor}`}>{c.tag}</span>
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">{c.ch}</p>
              <p className="text-xs text-neutral-400 mt-1 truncate">{c.msg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactProfileMock() {
  return (
    <div className="landing-hover-lift relative max-w-[400px] ml-auto">
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.11] to-white/[0.03] backdrop-blur-sm p-5 shadow-[0_18px_46px_-26px_rgba(56,189,248,0.45)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-neutral-700" />
          <div>
            <p className="text-base font-semibold text-white">Natasha Corwin</p>
            <p className="text-xs text-neutral-400">natasha@company.com</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {['FB', 'IG', 'WA'].map((icon) => (
            <span key={icon} className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] text-neutral-400">
              {icon}
            </span>
          ))}
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Enterprise lead · 4 conversations · tagged{' '}
          <span className="text-amber-400/90">VIP</span>. Notes and history stay on the contact profile.
        </p>
      </div>
    </div>
  );
}
