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
    <div className="min-h-screen bg-white text-neutral-950 font-sans antialiased">
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
          label="Saved replies"
          title="Respond faster with shortcuts your team already uses."
          description="Insert saved replies from the composer with a shortcut like /pricing. No retyping the same answers — your whole team stays consistent."
          visual={<SavedRepliesMock />}
        />

        <LandingFeatureSection
          index={1}
          label="Inbox search"
          title="Search across all your conversations."
          description="Find any contact or thread from the inbox search bar — filter by status, department, or keyword without opening each channel separately."
          visual={<SearchMock />}
        />

        <LandingFeatureSection
          index={2}
          label="Customer context"
          title="See the full picture beside every reply."
          description="Open the context panel for tags, private notes, and conversation history — without leaving the thread."
          visual={<ContextMock />}
        />
      </main>

      {/* Dark transition — Kinso quote block */}
      <section className="kinso-dark-grid py-20 sm:py-28">
        <Reveal className="mx-auto max-w-[900px] px-5 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold leading-snug tracking-[-0.02em] text-white">
            INTRA brings together every channel your customers use — so your team focuses on
            replies, not hunting across apps.
          </h2>
          <p className="mt-6 text-base sm:text-lg text-neutral-400 leading-relaxed max-w-[720px] mx-auto">
            Whether it&apos;s a WhatsApp lead, an Instagram DM, or an email follow-up, every
            message lands in one queue with assignment, status, and history built in.
          </p>
        </Reveal>
      </section>

      {/* Dark feature — department routing (real INTRA feature) */}
      <section className="kinso-dark-grid py-16 sm:py-24 border-t border-white/5">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-[2.25rem] font-semibold leading-tight tracking-[-0.02em] text-white">
              Route conversations to the{' '}
              <span className="text-amber-400/90">right team</span> automatically.
            </h2>
            <p className="mt-5 text-neutral-400 leading-relaxed">
              Departments, auto-replies, and assignment rules send each thread to Sales,
              Support, or Billing — with open, pending, and closed status on every row.
            </p>
          </div>
          <RoutingMock />
        </div>
      </section>

      {/* Dark feature — contact profiles */}
      <section className="kinso-dark-grid py-16 sm:py-24 border-t border-white/5">
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
              Tags like VIP, private notes, and conversation history live on each contact —
              shared across every thread with that person.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing — light */}
      <section id="pricing" className="kinso-light-grid py-20 sm:py-28 border-t border-neutral-100">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Pricing</p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950">
            Simple plans
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 text-left">
            {[
              { name: 'Starter', price: '$49', desc: '3 seats · all channels' },
              { name: 'Growth', price: '$99', desc: '10 seats · routing & departments', highlight: true },
              { name: 'Business', price: '$199', desc: 'Unlimited · analytics', },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${
                  p.highlight
                    ? 'border-neutral-950 bg-white shadow-lg ring-1 ring-neutral-950'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <h3 className="font-bold text-lg">{p.name}</h3>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {p.price}
                  <span className="text-sm font-normal text-neutral-500">/mo</span>
                </p>
                <p className="mt-3 text-sm text-neutral-600">{p.desc}</p>
                <Link
                  href="/register"
                  className={`mt-6 block rounded-full py-2.5 text-center text-sm font-semibold ${
                    p.highlight ? 'bg-neutral-950 text-white' : 'ring-1 ring-neutral-200 hover:bg-neutral-50'
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
      <section id="faq" className="kinso-dark-grid py-20 sm:py-28">
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
            Everything you need to know about INTRA. Email support@intrabox.com.ng for more.
          </p>
          <div className="mt-10 space-y-3">
            {[
              {
                q: 'How is INTRA different from a normal inbox?',
                a: 'Regular inboxes are one platform at a time. INTRA combines WhatsApp, Messenger, Instagram, and email with routing, contacts, and team assignment.',
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
                className="group rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 open:bg-white/[0.06]"
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
