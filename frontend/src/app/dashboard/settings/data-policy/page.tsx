'use client';

import React from 'react';

export default function DataDeletionPolicyPage() {
  const lastUpdated = 'March 29, 2026';

  return (
    <article className="space-y-6 text-sm text-gray-700 leading-relaxed">
      <div>
        <p className="text-xs text-gray-400">Last updated: {lastUpdated}</p>
        <h2 className="text-base font-semibold text-gray-900 mt-2">User data deletion policy</h2>
      </div>

      <section className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">1. Overview</h3>
        <p>
          <strong>INTRA</strong> is committed to protecting your privacy. This policy outlines what data we
          collect, how it is stored, and how to permanently delete it upon request.
        </p>
      </section>

      <section className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">2. Data we collect</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>Organization and staff profile data</li>
          <li>Customer contacts, conversations, and messages</li>
          <li>Channel integration credentials</li>
          <li>Routing rules, tags, and audit logs</li>
        </ul>
      </section>

      <section className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">3. How to delete your data</h3>
        <p>Admins can permanently delete all organization data from Settings → Danger zone.</p>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
          This action is irreversible. Export anything important before proceeding.
        </div>
        <ol className="list-decimal pl-5 space-y-1 text-gray-600">
          <li>Open Settings from the sidebar</li>
          <li>Scroll to Danger zone (admins only)</li>
          <li>Click Delete organization and confirm</li>
        </ol>
      </section>

      <section className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">4. Meta / Facebook deletion</h3>
        <p>
          You may also remove INTRA from your{' '}
          <a
            href="https://www.facebook.com/settings?tab=applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 underline"
          >
            Facebook App Settings
          </a>
          . Or email <strong>support@intrabox.com.ng</strong> with subject &ldquo;Data Deletion Request&rdquo;.
        </p>
      </section>

      <section className="rounded-xl bg-white ring-1 ring-inset ring-black/[0.04] p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">5. Contact</h3>
        <p>
          Questions? Email{' '}
          <a href="mailto:support@intrabox.com.ng" className="text-gray-900 underline">
            support@intrabox.com.ng
          </a>
        </p>
      </section>
    </article>
  );
}
