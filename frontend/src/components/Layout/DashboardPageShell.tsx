'use client';

import React from 'react';

interface DashboardPageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'md' | '2xl' | '4xl' | '6xl';
}

const maxWidthClass = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
};

export function DashboardPageShell({
  title,
  description,
  actions,
  children,
  maxWidth = '2xl',
}: DashboardPageShellProps) {
  return (
    <div className="h-full flex flex-col bg-transparent min-h-0">
      <header className="flex-shrink-0 intra-dashboard-surface-strong border-b border-gray-200 px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {description && <p className="text-sm text-slate-600 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5">
        <div className={`w-full mx-auto ${maxWidthClass[maxWidth]}`}>
          <div className="rounded-2xl intra-dashboard-surface ring-1 ring-inset ring-white/60 p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
