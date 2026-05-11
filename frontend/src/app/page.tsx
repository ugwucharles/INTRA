'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navLinkClass =
  'text-sm font-medium text-neutral-600 transition hover:text-neutral-900';

function PricingMark({ included }: { included: boolean }) {
  if (included) {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-neutral-900 text-white shadow-sm"
        aria-label="Included"
      >
        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2 6l2.5 2.5L10 2.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-red-500 text-[10px] font-bold text-white shadow-sm"
      aria-label="Not included"
    >
      ×
    </span>
  );
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-neutral-950 antialiased">
      {/* Subtle grid + wash (Kinso-adjacent: calm, editorial) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%)',
        }}
      />

      <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-[#fafaf9]/80 font-sans backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/intra-logo-new.png"
              alt="INTRA"
              width={100}
              height={32}
              className="h-8 w-auto mix-blend-multiply grayscale brightness-[1.15] contrast-[1.2]"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#product" className={navLinkClass}>
              Product
            </a>
            <a href="#features" className={navLinkClass}>
              Features
            </a>
            <a href="#pricing" className={navLinkClass}>
              Pricing
            </a>
            <a href="#faq" className={navLinkClass}>
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:bg-neutral-50 md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <svg 
                className="h-4 w-4 text-neutral-600 transition-transform group-active:scale-90" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              >
                {mobileNavOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <>
                    <path d="M5 8h14M5 16h14" />
                  </>
                )}
              </svg>
            </button>
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </div>

        {mobileNavOpen && (
          <div
            id="mobile-nav"
            className="border-t border-neutral-200 bg-[#fafaf9] px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {[
                ['#product', 'Product'],
                ['#features', 'Features'],
                ['#pricing', 'Pricing'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                onClick={() => setMobileNavOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero — split headline rhythm like Kinso */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="fade-up mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Unified inbox for serious teams
            </p>
            <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-neutral-900 sm:text-6xl sm:leading-[1.02] md:text-7xl">
              One inbox,
              <span className="mt-1 block bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-500 bg-clip-text text-transparent sm:mt-2">
                every channel.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg md:text-xl">
              INTRA brings WhatsApp, Messenger, Instagram, and email into one calm
              workspace—so your team responds faster with full context, not tab
              chaos.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-neutral-900 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Start for free
              </Link>
              <a
                href="#pricing"
                className="rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
              >
                View pricing
              </a>
            </div>
          </div>

          <div className="fade-up fade-up-delay-2 mt-16 sm:mt-20">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] sm:rounded-3xl">
              <div className="flex h-11 items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-mono text-[11px] text-neutral-400">
                  intrabox.com.ng/dashboard
                </span>
              </div>
              <Image
                src="/dashboard-final.png"
                alt="INTRA dashboard preview"
                width={1440}
                height={900}
                priority
                className="h-auto w-full object-cover object-top"
              />
            </div>
          </div>
        </section>

        {/* Meta Approved / Integrations line — subtle, high-trust */}
        <section className="border-y border-neutral-200/60 bg-white/50 py-10 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/meta-logo-new.svg"
                alt="Meta"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-neutral-300">
                Approved
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 opacity-90 transition-all">
              <div className="flex items-center gap-2 group cursor-default">
                <svg className="h-6 w-6 text-[#0084FF] transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
                <span className="text-sm font-semibold tracking-tight text-neutral-700">Messenger</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <svg className="h-6 w-6 text-[#E4405F] transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.333-3.608-1.308-.975-.975-1.246-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.355 2.618 6.778 6.98 6.978 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.948-.197-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span className="text-sm font-semibold tracking-tight text-neutral-700">Instagram</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <svg className="h-6 w-6 text-[#25D366] transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                <span className="text-sm font-semibold tracking-tight text-neutral-700">WhatsApp</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product narrative */}
        <section
          id="product"
          className="border-y border-neutral-200/80 bg-white py-20 sm:py-28"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Channels
            </p>
            <h2 className="mx-auto mt-4 max-w-3xl text-center text-3xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-4xl md:text-[2.75rem] md:leading-tight">
              Every conversation in one thread—without losing the platform
              your customer chose.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base text-neutral-600 sm:text-lg">
              Route by department, see history and notes beside the message, and keep
              your brand voice consistent across every touchpoint.
            </p>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  tag: 'Inbox',
                  title: 'Unified timeline',
                  body: 'One queue for WhatsApp, Messenger, Instagram DMs, and email—priorities stay visible.',
                },
                {
                  tag: 'Routing',
                  title: 'Smarter assignment',
                  body: 'Send conversations to the right team by rules, load, and department context.',
                },
                {
                  tag: 'Ops',
                  title: 'Built for volume',
                  body: 'Keyboard-friendly flows and real-time updates when your queue gets busy.',
                },
                {
                  tag: 'Context',
                  title: 'Customer memory',
                  body: 'Profiles, tags, and conversation history stay attached to every reply.',
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-neutral-200 bg-[#fafaf9] p-6 transition hover:border-neutral-300 hover:shadow-md"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    {item.tag}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-neutral-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section — Clean, powerful numbers */}
        <section className="border-y border-neutral-200/80 bg-neutral-900 py-16 text-white sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-6">
            {[
              { value: '< 60s', label: 'First response target' },
              { value: '4+', label: 'Native channels' },
              { value: 'Real-time', label: 'Live queue updates' },
              { value: '1 view', label: 'Unified timeline' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-3 text-sm font-medium uppercase tracking-widest text-neutral-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing — matches published matrix; product enforcement is server-side by plan */}
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-4xl">
              Simple plans. The same limits apply in the product.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-neutral-600">
              Feature access and seat caps are enforced on the server from your organization&apos;s
              plan, so customers never get more or less than they pay for.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '$49',
                desc: 'For small teams getting started with unified messaging.',
                features: [
                  'Unified inbox',
                  'All 4 native channels',
                  'Auto-reply & Greetings',
                  'Internal staff notes',
                  'Contact management',
                  '3 Staff seats',
                ],
                button: 'Start for free',
                primary: false,
              },
              {
                name: 'Growth',
                price: '$99',
                desc: 'Scale your operations with advanced routing and departments.',
                features: [
                  'Everything in Starter',
                  'Department-based routing',
                  'Smart queue assignment',
                  'Conversation escalation',
                  'Staff performance ratings',
                  '10 Staff seats',
                ],
                button: 'Try Growth',
                primary: true,
              },
              {
                name: 'Business',
                price: '$199',
                desc: 'For high-volume teams requiring deep insights and unlimited scale.',
                features: [
                  'Everything in Growth',
                  'Advanced team analytics',
                  'Custom metadata fields',
                  'Priority support',
                  'SLA monitoring',
                  'Unlimited Staff seats',
                ],
                button: 'Contact Sales',
                primary: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 transition-all hover:shadow-xl ${
                  plan.primary
                    ? 'border-neutral-900 bg-white shadow-lg ring-1 ring-neutral-900'
                    : 'border-neutral-200 bg-[#fafaf9] hover:border-neutral-300'
                }`}
              >
                {plan.primary && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-neutral-900">{plan.price}</span>
                    <span className="text-sm font-medium text-neutral-500">/mo</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-600">{plan.desc}</p>
                </div>

                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    What's included
                  </p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3">
                        <PricingMark included={true} />
                        <span className="text-sm text-neutral-700">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/register"
                  className={`mt-10 rounded-full py-3 text-center text-sm font-semibold transition-all ${
                    plan.primary
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-md'
                      : 'bg-white text-neutral-900 ring-1 ring-neutral-300 hover:ring-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  {plan.button}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 font-sans">
            <Link
              href="/register"
              className="rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Get started
            </Link>
            <a
              href="#faq"
              className="rounded-full border border-neutral-300 bg-white px-8 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Questions
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="border-t border-neutral-200/80 bg-white py-20 sm:py-28"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              FAQ
            </p>
            <h2 className="mt-4 text-center text-3xl font-semibold tracking-[-0.03em] text-neutral-900 sm:text-4xl">
              Questions, answered.
            </h2>
            <div className="mt-12 space-y-3">
              {[
                {
                  q: 'What channels does INTRA support?',
                  a: 'WhatsApp Business Cloud, Facebook Messenger, Instagram DMs (professional accounts linked to a Page), and email—together in one inbox.',
                },
                {
                  q: 'Do customers still use their original apps?',
                  a: 'Yes. Messages sent from INTRA are delivered on the channel your customer used. They do not need to install anything new.',
                },
                {
                  q: 'Is INTRA only for support teams?',
                  a: 'No. Sales, success, and hybrid teams use INTRA anywhere conversations need ownership, context, and fast follow-up.',
                },
                {
                  q: 'How do we get access?',
                  a: 'Create an account to explore the product. For Scale-tier security reviews or custom terms, contact us from your workspace once pricing is live.',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-neutral-200 bg-[#fafaf9] px-5 py-4 open:bg-white open:shadow-md"
                >
                  <summary className="cursor-pointer list-none font-medium text-neutral-900 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {item.q}
                      <span className="text-neutral-400 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 px-8 py-14 text-center text-white sm:px-14 sm:py-16">
            <p className="text-sm font-medium text-neutral-400">
              Ready when your team is.
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
              Ship a calmer inbox this week.
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/25 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-neutral-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} INTRA BOX</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/terms" className="hover:text-neutral-900">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900">
              Privacy
            </Link>
            <Link href="/data-deletion" className="hover:text-neutral-900">
              Data deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
