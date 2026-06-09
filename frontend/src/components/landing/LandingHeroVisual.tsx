import React from 'react';
import Image from 'next/image';

/** Kinso-style layered product visual — uses real INTRA dashboard screenshot */
export function LandingHeroVisual() {
  return (
    <div className="relative w-full max-w-[560px] ml-auto">
      {/* Soft orbs behind */}
      <div className="absolute -top-8 -right-8 w-64 h-64 rounded-full bg-[#ffd4c4]/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-12 w-56 h-56 rounded-full bg-[#b8e8e8]/35 blur-3xl pointer-events-none" />

      {/* Desktop window */}
      <div className="relative rounded-2xl border border-neutral-200/80 bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="flex h-9 items-center gap-1.5 border-b border-neutral-100 bg-neutral-50/90 px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <Image
          src="/dashboard-final.png"
          alt="INTRA inbox"
          width={1120}
          height={700}
          className="w-full h-auto object-cover object-left-top"
          priority
        />
      </div>

      {/* Floating insight card — real feature: open conversation alert */}
      <div className="absolute -right-2 top-[18%] w-[220px] rounded-2xl border border-red-100 bg-white/95 backdrop-blur-md p-3.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.15)] hidden sm:block">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wide">Open</span>
        </div>
        <p className="text-[11px] font-semibold text-neutral-900 leading-snug">New WhatsApp message</p>
        <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
          Customer asking about pricing — assigned to Sales.
        </p>
      </div>

      {/* Phone overlay */}
      <div className="absolute -left-4 bottom-[-12px] w-[140px] rounded-[28px] border-[6px] border-neutral-900 bg-neutral-900 shadow-2xl hidden lg:block overflow-hidden">
        <div className="bg-white px-3 pt-6 pb-4 min-h-[200px]">
          <p className="text-[10px] font-semibold text-neutral-900 leading-tight">
            Good morning.
          </p>
          <p className="text-[9px] text-neutral-500 mt-1 leading-relaxed">
            3 open conversations across WhatsApp &amp; Instagram.
          </p>
          <div className="mt-3 rounded-full bg-neutral-100 px-2.5 py-1.5 text-[8px] text-neutral-400">
            Search conversations…
          </div>
          <div className="mt-2 space-y-1.5">
            {['Sarah · Open', 'James · Pending'].map((row) => (
              <div key={row} className="rounded-lg bg-neutral-50 px-2 py-1.5 text-[8px] text-neutral-600">
                {row}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
