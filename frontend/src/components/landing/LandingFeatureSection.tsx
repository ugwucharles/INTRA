import React from 'react';
import { Reveal } from './Reveal';

interface LandingFeatureSectionProps {
  label: string;
  title: string;
  description: string;
  extra?: string;
  visual: React.ReactNode;
  index?: number;
}
const SECTION_THEMES = [
  {
    chip: 'text-amber-700 bg-amber-100/90 border-amber-200/70',
    panel: 'from-[#fff6ea] via-white to-[#edf9ff]',
    glow: 'from-amber-300/70 via-orange-200/45 to-transparent',
  },
  {
    chip: 'text-sky-700 bg-sky-100/90 border-sky-200/70',
    panel: 'from-[#eff7ff] via-white to-[#eefcff]',
    glow: 'from-sky-300/70 via-cyan-200/45 to-transparent',
  },
  {
    chip: 'text-violet-700 bg-violet-100/90 border-violet-200/70',
    panel: 'from-[#f3f0ff] via-white to-[#f0fffb]',
    glow: 'from-violet-300/65 via-fuchsia-200/40 to-transparent',
  },
];

export function LandingFeatureSection({
  label,
  title,
  description,
  extra,
  visual,
  index = 0,
}: LandingFeatureSectionProps) {
  const theme = SECTION_THEMES[index % SECTION_THEMES.length];
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
        <Reveal delay={index * 80}>
          <div className={`landing-hover-lift relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br ${theme.panel} px-6 py-7 sm:px-10 sm:py-10 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.55)]`}>
            <div className={`pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-gradient-to-br ${theme.glow} blur-3xl`} />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <p className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.chip}`}>
              {label}
            </p>
            <h2 className="mt-5 max-w-[760px] text-[2rem] sm:text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.03em] text-neutral-950">
              {title}
            </h2>
            <p className="mt-5 max-w-[680px] text-base leading-relaxed text-neutral-700 sm:text-lg">
              {description}
            </p>
            {extra && <p className="mt-3 max-w-[680px] text-base leading-relaxed text-neutral-600">{extra}</p>}
          </div>
        </Reveal>
        <Reveal delay={index * 80 + 120} className="mt-10 sm:mt-12">
          <div className="landing-hover-lift kinso-ambient-shimmer relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-3 sm:p-5 shadow-[0_28px_64px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/65 via-transparent to-white/15" />
            <div className="relative">{visual}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
