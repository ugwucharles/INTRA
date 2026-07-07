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
import { Inbox, Workflow, User, Users, Check, ChevronDown } from 'lucide-react';

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
                  INTRA brings together WhatsApp, Messenger, and Instagram. Your team
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
        {/* Features - Clean alternating layout */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <Reveal className="text-center max-w-3xl mx-auto mb-20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Features</p>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-neutral-950">
                Built for modern customer teams
              </h2>
              <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
                Everything you need to manage conversations across WhatsApp, Messenger, and Instagram in one place.
              </p>
            </Reveal>

            {/* Feature 1 */}
            <Reveal delay={100}>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                    <Inbox className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-950 mb-4">
                    Unified inbox
                  </h3>
                  <p className="text-neutral-600 leading-relaxed mb-6">
                    All your customer conversations in one place. WhatsApp, Messenger, and Instagram messages flow into a single queue with assignee, status, and channel source visible at a glance.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-blue-600" />
                      <span>All channels in one view</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-blue-600" />
                      <span>Team assignment and status</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-blue-600" />
                      <span>Real-time sync across devices</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
                  <SavedRepliesMock />
                </div>
              </div>
            </Reveal>

            {/* Feature 2 */}
            <Reveal delay={150}>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
                <div className="order-2 lg:order-1">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
                    <RoutingMock />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                    <Workflow className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-950 mb-4">
                    Smart routing
                  </h3>
                  <p className="text-neutral-600 leading-relaxed mb-6">
                    Automatically route conversations to the right team. Set up rules based on channel, intent, tags, and workload to ensure every message reaches the right person instantly.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span>Rule-based automation</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span>Department assignment</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span>Auto-replies and triggers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>

            {/* Feature 3 */}
            <Reveal delay={200}>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-950 mb-4">
                    Customer context
                  </h3>
                  <p className="text-neutral-600 leading-relaxed mb-6">
                    Never lose track of customer history. Profile tags, private notes, past conversations, and cross-channel activity stay attached to every contact.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-amber-600" />
                      <span>Complete conversation history</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-amber-600" />
                      <span>Tags and custom fields</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-amber-600" />
                      <span>Private team notes</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
                  <ContextMock />
                </div>
              </div>
            </Reveal>

            {/* Feature 4 */}
            <Reveal delay={250}>
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="order-2 lg:order-1">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
                    <ContactProfileMock />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-neutral-900" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-semibold text-neutral-950 mb-4">
                    Team collaboration
                  </h3>
                  <p className="text-neutral-600 leading-relaxed mb-6">
                    Work together seamlessly. Assign conversations, add internal notes, and hand off between team members without losing context.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-neutral-900" />
                      <span>Conversation assignment</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-neutral-900" />
                      <span>Internal mentions and notes</span>
                    </li>
                    <li className="flex items-center gap-3 text-neutral-600">
                      <Check className="w-5 h-5 text-neutral-900" />
                      <span>Role-based access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>


      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-32 bg-neutral-50">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <Reveal className="text-center max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Pricing</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '$49', period: '/month', desc: 'Perfect for small teams getting started', features: ['3 team seats', 'All channels included', 'Unified inbox', 'Basic analytics'] },
              { name: 'Growth', price: '$99', period: '/month', desc: 'For growing teams with automation needs', features: ['10 team seats', 'Routing & automation', 'Advanced analytics', 'Priority support'], highlight: true },
              { name: 'Business', price: '$199', period: '/month', desc: 'For organizations at scale', features: ['Unlimited team seats', 'Custom workflows', 'SLA management', 'Dedicated support'] },
            ].map((p) => (
              <Reveal key={p.name} delay={100}>
                <div className={`relative rounded-3xl p-8 ${
                  p.highlight
                    ? 'bg-neutral-900 text-white border-2 border-neutral-900'
                    : 'bg-white border border-neutral-200'
                }`}>
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-neutral-900 text-white text-xs font-semibold rounded-full">
                      Most popular
                    </div>
                  )}
                  <h3 className={`text-xl font-semibold ${p.highlight ? 'text-white' : 'text-neutral-950'}`}>{p.name}</h3>
                  <p className={`mt-2 text-sm ${p.highlight ? 'text-neutral-400' : 'text-neutral-600'}`}>{p.desc}</p>
                  <div className="mt-6">
                    <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-neutral-950'}`}>{p.price}</span>
                    <span className={`text-sm ${p.highlight ? 'text-neutral-400' : 'text-neutral-600'}`}>{p.period}</span>
                  </div>
                  <ul className="mt-8 space-y-4">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 ${p.highlight ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <span className={`text-sm ${p.highlight ? 'text-neutral-300' : 'text-neutral-600'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                      p.highlight
                        ? 'bg-white text-neutral-900 hover:bg-neutral-100'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-32 bg-white">
        <div className="mx-auto max-w-[800px] px-5 sm:px-8">
          <Reveal className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">FAQ</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-neutral-600 leading-relaxed">
              Everything you need to know about INTRA
            </p>
          </Reveal>

          <div className="mt-16 space-y-4">
            {[
              {
                q: 'How is INTRA different from a normal inbox?',
                a: 'Most inboxes only organize one channel. INTRA combines WhatsApp, Messenger, and Instagram with team assignment, routing rules, and shared customer context.',
              },
              {
                q: 'Do customers still use their original apps?',
                a: 'Yes. Messages you send from INTRA arrive natively on the channel they used. They never need a new app.',
              },
              {
                q: 'What channels are supported?',
                a: 'WhatsApp Business Cloud, Facebook Messenger, and Instagram DMs.',
              },
              {
                q: 'Is my data secure?',
                a: 'Data is scoped per organization with role-based access. Channel tokens are never shared across tenants.',
              },
              {
                q: 'Can I try INTRA before committing?',
                a: 'Yes. Start with our free trial to explore all features before upgrading to a paid plan.',
              },
            ].map((item, index) => (
              <Reveal key={item.q} delay={index * 50}>
                <details className="group rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-5 open:bg-white">
                  <summary className="cursor-pointer list-none text-base font-medium text-neutral-950 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0 group-open:rotate-180 transition-transform" />
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-neutral-900">
        <div className="mx-auto max-w-[800px] px-5 sm:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white">
              Ready to unify your customer conversations?
            </h2>
            <p className="mt-4 text-base text-neutral-400 leading-relaxed">
              Join teams already using INTRA to respond faster and close more deals.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              Get started free
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </Link>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
