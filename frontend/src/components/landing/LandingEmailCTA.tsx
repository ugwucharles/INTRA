'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Kinso-style email pill. INTRA is live — this sends people to signup with email prefilled,
 * not a pre-launch waitlist database.
 */
export function LandingEmailCTA() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (trimmed) {
      router.push(`/register?email=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="mt-8 w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 pl-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] ring-1 ring-neutral-100"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 min-w-0 bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          aria-label="Work email"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-neutral-950 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Get started
        </button>
      </form>
      <p className="mt-3 text-[13px] text-neutral-500">
        Free to start · set up in minutes ·{' '}
        <span className="text-neutral-700">no credit card</span>
      </p>
    </div>
  );
}
