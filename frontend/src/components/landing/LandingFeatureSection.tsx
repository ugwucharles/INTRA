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

export function LandingFeatureSection({
  label,
  title,
  description,
  extra,
  visual,
  index = 0,
}: LandingFeatureSectionProps) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[900px] px-5 sm:px-8">
        <Reveal delay={index * 80}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">{label}</p>
          <h2 className="mt-5 text-[2rem] sm:text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.03em] text-neutral-950 max-w-[720px]">
            {title}
          </h2>
          <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-[640px]">{description}</p>
          {extra && <p className="mt-3 text-base text-neutral-500 leading-relaxed max-w-[640px]">{extra}</p>}
        </Reveal>
        <Reveal delay={index * 80 + 120} className="mt-14 sm:mt-16">
          {visual}
        </Reveal>
      </div>
    </section>
  );
}
