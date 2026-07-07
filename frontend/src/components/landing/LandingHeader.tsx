'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQs' },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 pointer-events-none">
      <div
        className={`
          pointer-events-auto mx-auto max-w-[1120px] rounded-xl transition-all duration-300
          backdrop-blur-md border border-white/60
          ${scrolled ? 'bg-white/80 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]' : 'bg-white/50 shadow-[0_0.6px_0.6px_-1.25px_rgba(0,0,0,0.18),0_2.3px_2.3px_-2.5px_rgba(0,0,0,0.16),0_10px_10px_-3.75px_rgba(0,0,0,0.06)]'}
        `}
      >
        <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/intra-logo-new.png"
              alt="INTRA"
              width={56}
              height={18}
              className="h-[17px] w-auto"
              priority
            />
          </Link>

          {/* Center nav — Kinso layout */}
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:justify-self-end ml-auto">
            <button
              type="button"
              className="md:hidden p-2 -mr-1 text-neutral-600 hover:text-neutral-900"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              aria-expanded={open}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                )}
              </svg>
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex text-[15px] font-medium text-neutral-800 hover:text-neutral-950 px-2 py-1.5 transition-colors"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-0.5 rounded-full bg-neutral-950 px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-medium text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              Get started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-neutral-200/60 px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2.5 text-[15px] font-medium text-neutral-800"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="block py-2.5 text-[15px] font-medium text-neutral-600"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
