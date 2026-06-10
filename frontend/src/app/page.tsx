'use client';

import React from 'react';
import Link from 'next/link';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHeroVisual } from '@/components/landing/LandingHeroVisual';
import { LandingFeatureSection } from '@/components/landing/LandingFeatureSection';
import {
  ContextMock,
  ContactProfileMock,
  RoutingMock,
  SavedRepliesMock,
  SearchMock,
} from '@/components/landing/LandingMocks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ChannelIconRow } from '@/components/landing/ChannelIcons';
import { LandingEmailCTA } from '@/components/landing/LandingEmailCTA';
import { Reveal } from '@/components/landing/Reveal';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f7f8ff] text-neutral-950 font-sans antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="landing-bg-orb landing-bg-orb-a" />
        <div className="landing-bg-orb landing-bg-orb-b" />
        <div className="landing-bg-orb landing-bg-orb-c" />
      </div>
      <LandingHeader />

      {/* Hero — Kinso split layout */}
      <section className="kinso-light-grid kinso-hero-glow relative overflow-hidden">
        <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8 pt-24 sm:pt-28 pb-16 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <Reveal>
              <div className="max-w-xl">
                <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4rem] font-semibold leading-[1.02] tracking-[-0.04em] text-neutral-950">
                  One inbox,
                  <br />
                  every conversation.
                </h1>
                <p className="mt-6 text-base sm:text-lg text-neutral-600 leading-relaxed">
                  INTRA brings together WhatsApp, Messenger, Instagram, and email. Your team
                  sees full context beside every thread, routes to the right department, and
                  replies with saved responses — without switching apps.
                </p>
                <LandingEmailCTA />
              </div>
            </Reveal>
            <Reveal delay={150}>
              <LandingHeroVisual />
            </Reveal>
          </div>

          {/* Integration icons — Kinso row */}
          <Reveal delay={200} className="mt-16 sm:mt-24">
            <ChannelIconRow />
          </Reveal>
        </div>
      </section>

      <main id="features">
        <LandingFeatureSection
          index={0}
          label="Unified inbox"
          title="Run WhatsApp, Messenger, Instagram, and email from one team inbox."
          description="INTRA merges every incoming message into one operational queue with assignee, status, and channel source visible at a glance."
          extra="No tab hopping. Sales and support teams work from the same live inbox and never lose context between channels."
          visual={<SavedRepliesMock />}
        />

        <LandingFeatureSection
          index={1}
          label="Automation & routing"
          title="Automatically route each conversation to the right department."
          description="Use rules for channel, intent, tags, and workload to send chats directly to Sales, Support, or Billing in seconds."
          extra="INTRA can trigger instant auto-replies, then assign ownership with clear SLA status so no lead or ticket sits idle."
          visual={<SearchMock />}
        />

        <LandingFeatureSection
          index={2}
          label="Customer intelligence"
          title="Give every teammate the same customer memory before they reply."
          description="Each thread includes profile tags, private notes, past conversation history, and cross-channel activity in one view."
          extra="You respond with full context every time, even when a different teammate handled the last interaction."
          visual={<ContextMock />}
        />
      </main>

      {/* Dark transition — Kinso quote block */}
      <section className="kinso-dark-grid kinso-dark-aurora py-20 sm:py-28">
        <Reveal className="mx-auto max-w-[900px] px-5 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold leading-snug tracking-[-0.02em] text-white">
            INTRA is your conversation operations layer — from first lead to support follow-up,
            everything happens in one coordinated workspace.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-neutral-400 leading-relaxed max-w-[720px] mx-auto">
            Every message lands in a single queue with assignment, priority, and history built
            in, so teams close faster without sacrificing response quality.
          </p>
        </Reveal>
      </section>

      {/* Dark feature — department routing (real INTRA feature) */}
      <section className="kinso-dark-grid kinso-dark-aurora py-16 sm:py-24 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-[2.25rem] font-semibold leading-tight tracking-[-0.02em] text-white">
              Route and prioritize conversations with{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">zero manual triage.</span>
            </h2>
            <p className="mt-5 text-neutral-400 leading-relaxed">
              Departments, assignment rules, and automation keep every thread moving to the
              teammate who should own it next, with open, pending, and resolved states tracked
              live.
            </p>
          </div>
          <RoutingMock />
        </div>
      </section>

      {/* Dark feature — contact profiles */}
      <section className="kinso-dark-grid kinso-dark-aurora py-16 sm:py-24 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <ContactProfileMock />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl sm:text-[2.25rem] font-semibold leading-tight tracking-[-0.02em] text-white">
              Remember every{' '}
              <span className="bg-gradient-to-r from-amber-300 to-teal-300 bg-clip-text text-transparent">
                detail
              </span>{' '}
              on the contact profile.
            </h2>
            <p className="mt-5 text-neutral-400 leading-relaxed">
              INTRA builds a living customer record from every channel: tags, notes, team
              handoff context, and previous replies all stay attached to the contact.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing — light */}
      <section id="pricing" className="kinso-light-grid kinso-pricing-aurora relative py-20 sm:py-28 border-t border-neutral-100">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Pricing</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950">
            Plans for teams that run revenue + support in one inbox
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-sm leading-relaxed text-neutral-600 sm:text-base">
            Start small, then scale into advanced routing and analytics as your conversation
            volume grows.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
            {[
              { name: 'Starter', price: '$49', desc: '3 seats · unified inbox + all channels' },
              { name: 'Growth', price: '$99', desc: '10 seats · routing, automation, analytics', highlight: true },
              { name: 'Business', price: '$199', desc: 'Unlimited seats · priority support + control' },
            ].map((p) => (
              <div
                key={p.name}
                className={`landing-hover-lift relative overflow-hidden rounded-3xl p-6 border ${
                  p.highlight
                    ? 'border-indigo-400/60 bg-gradient-to-br from-indigo-900 via-indigo-800 to-cyan-700 text-white shadow-[0_35px_80px_-34px_rgba(30,64,175,0.9)]'
                    : 'border-white/80 bg-white/80 backdrop-blur-xl shadow-[0_25px_56px_-38px_rgba(15,23,42,0.75)]'
                }`}
              >
                <div className={`pointer-events-none absolute -top-16 -right-14 h-40 w-40 rounded-full blur-3xl ${p.highlight ? 'bg-cyan-300/35' : 'bg-amber-200/40'}`} />
                <h3 className="relative font-bold text-lg">{p.name}</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {p.price}
                  <span className={`text-sm font-normal ${p.highlight ? 'text-cyan-100' : 'text-neutral-500'}`}>/mo</span>
                </p>
                <p className={`mt-3 text-sm ${p.highlight ? 'text-indigo-100' : 'text-neutral-600'}`}>{p.desc}</p>
                <Link
                  href="/register"
                  className={`mt-6 block rounded-full py-2.5 text-center text-sm font-semibold ${
                    p.highlight
                      ? 'bg-white text-indigo-900 hover:bg-indigo-50'
                      : 'bg-neutral-950 text-white hover:bg-neutral-800'
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — Kinso dark accordion */}
      <section id="faq" className="kinso-dark-grid kinso-dark-aurora py-20 sm:py-28">
        <div className="mx-auto max-w-[720px] px-5 sm:px-8">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-medium text-neutral-500 px-3 py-1 rounded-full border border-white/10">
              FAQs
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <h2 className="text-center text-2xl sm:text-3xl font-semibold text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-center text-sm text-neutral-400">
            Questions teams ask before moving all customer conversations into INTRA.
          </p>
          <div className="mt-10 space-y-3">
            {[
              {
                q: 'How is INTRA different from a normal inbox?',
                a: 'Most inboxes only organize one channel. INTRA combines WhatsApp, Messenger, Instagram, and email with team assignment, routing rules, and shared customer context.',
              },
              {
                q: 'Do customers still use their original apps?',
                a: 'Yes. Messages you send from INTRA arrive natively on the channel they used. They never need a new app.',
              },
              {
                q: 'What channels are supported?',
                a: 'WhatsApp Business Cloud, Facebook Messenger, Instagram DMs, and email.',
              },
              {
                q: 'Is my data secure?',
                a: 'Data is scoped per organization with role-based access. Channel tokens are never shared across tenants.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group landing-hover-lift rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 open:bg-white/[0.08]"
              >
                <summary className="cursor-pointer list-none text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-neutral-500 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
                  </span>
                </summary>
                <p className="mt-3 pt-3 border-t border-white/10 text-sm text-neutral-400 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
