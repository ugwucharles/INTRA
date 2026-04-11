'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styled from 'styled-components';

const PageShell = styled.div`
  min-height: 100vh;
  background: #f5f5f7;
  color: #1d1d1f;
`;

const GradientBand = styled.section`
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background:
    radial-gradient(circle at 12% 22%, rgba(90, 150, 255, 0.14), transparent 28%),
    radial-gradient(circle at 82% 30%, rgba(180, 130, 255, 0.12), transparent 28%),
    linear-gradient(180deg, #fbfbfd 0%, #f5f5f7 100%);
`;

const FeatureGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const PremiumCard = styled.article`
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1.5rem;
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.08);
  }
`;

const StatStrip = styled.div`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export default function LandingPage() {
  return (
    <PageShell>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#f5f5f7]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/intra.logo.1.png"
              alt="INTRA"
              width={90}
              height={28}
              className="h-7 w-auto mix-blend-multiply"
            />
            <span className="hidden text-[11px] font-medium tracking-[0.18em] text-[#6e6e73] sm:block">
              CUSTOMER OS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-[#3a3a3c] hover:bg-white">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#1d1d1f] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="fade-up">
            <p className="text-sm font-medium tracking-tight text-[#6e6e73]">
              New era customer communication platform
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-7xl">
              One Inbox.
              <span className="block bg-gradient-to-r from-[#1d1d1f] to-[#6e6e73] bg-clip-text text-transparent">
                Infinite clarity.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#6e6e73] sm:text-xl">
              Unified customer communication for modern teams that care about speed,
              quality, and brand experience.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[#0071e3] px-7 py-3 text-sm font-medium text-white hover:bg-[#0065cc]"
              >
                Start for free
              </Link>
              <Link
                href="#features"
                className="rounded-full border border-black/10 bg-white px-7 py-3 text-sm font-medium text-[#1d1d1f] hover:bg-[#fafafa]"
              >
                Explore features
              </Link>
            </div>
          </div>

          <div className="mt-14 fade-up fade-up-delay-2">
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-black/10 bg-white p-2 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
              <div className="flex h-10 items-center gap-2 border-b border-black/5 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[11px] text-[#8e8e93]">intrabox.com.ng/dashboard</span>
              </div>
              <Image
                src="/dashboard-final.png"
                alt="INTRA dashboard preview"
                width={1440}
                height={900}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </section>

        <GradientBand>
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Crafted for teams that expect more
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-base text-[#6e6e73]">
              A refined workspace with premium rhythm, precise hierarchy, and
              delightful operational flow.
            </p>

            <FeatureGrid className="mt-8">
              {[
                {
                  title: 'Unified Conversations',
                  body: 'WhatsApp, Messenger, Instagram, and Email in one clean timeline.',
                },
                {
                  title: 'Smart Routing',
                  body: 'Automatic assignment logic with department and availability awareness.',
                },
                {
                  title: 'Live Performance',
                  body: 'Real-time insight into team speed, quality, and conversation outcomes.',
                },
                {
                  title: 'Customer Context',
                  body: 'Keep profile, history, and notes close to every interaction.',
                },
              ].map((item) => (
                <PremiumCard key={item.title}>
                  <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6e6e73]">{item.body}</p>
                </PremiumCard>
              ))}
            </FeatureGrid>
          </section>
        </GradientBand>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_12px_34px_rgba(0,0,0,0.06)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">
                  Premium workflow architecture
                </p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-4xl">
                  Elegant by default.
                  <span className="block text-[#6e6e73]">Powerful when needed.</span>
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#6e6e73]">
                  Your support stack should feel calm even at high volume.
                  INTRA gives your team a polished command center that scales with confidence.
                </p>
              </div>
              <StatStrip>
                {[
                  { value: '< 60s', label: 'First response target' },
                  { value: '4+', label: 'Native channels' },
                  { value: '24/7', label: 'Routing continuity' },
                  { value: '1 View', label: 'Unified timeline' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-black/10 bg-[#fafafc] px-4 py-5 text-center"
                  >
                    <p className="text-xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs text-[#6e6e73]">{stat.label}</p>
                  </div>
                ))}
              </StatStrip>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Unified Conversations',
                body: 'WhatsApp, Messenger, Instagram, and Email in one clean timeline.',
              },
              {
                title: 'Smart Routing',
                body: 'Automatic assignment logic with department and availability awareness.',
              },
              {
                title: 'Live Performance',
                body: 'Real-time insight into team speed, quality, and conversation outcomes.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white p-7 shadow-[0_6px_24px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]"
              >
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6e6e73]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white px-8 py-14 text-center sm:px-14">
            <p className="text-sm font-medium text-[#6e6e73]">Ready to modernize your support operation?</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl">
              Built to feel effortless.
              <span className="block text-[#6e6e73]">Designed to scale serious teams.</span>
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-full bg-[#1d1d1f] px-7 py-3 text-sm font-medium text-white hover:opacity-90">
                Create account
              </Link>
              <Link href="/login" className="rounded-full border border-black/10 px-7 py-3 text-sm font-medium text-[#1d1d1f] hover:bg-[#fafafa]">
                Go to login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white/60 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#6e6e73] sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} INTRA BOX</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-[#1d1d1f]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#1d1d1f]">
              Privacy
            </Link>
            <Link href="/data-deletion" className="hover:text-[#1d1d1f]">
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </PageShell>
  );
}
