import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Data Deletion Instructions – INTRA BOX',
  description: 'Instructions on how to request deletion of your data from INTRA BOX.',
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen font-sans text-gray-900" style={{ background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(251,146,60,0.12) 0%, transparent 60%), #ffffff' }}>
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/intra.logo.1.png" alt="INTRA Logo" width={90} height={28} className="h-7 w-auto" />
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Data Deletion Instructions</h1>
          <p className="text-gray-500 text-sm">Last updated: March 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">User Data Deletion Request</h2>
            <p>
              In compliance with Meta Platform policies, INTRA BOX provides a way for users to request the deletion of their personal data collected through our platform. 
              If you wish to delete your user account and all associated data, you can do so by following the instructions below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">How to Delete Your Data</h2>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-lg">
              <h3 className="font-bold text-orange-900 mb-2">Option 1: In-App Deletion</h3>
              <p className="text-orange-800">
                1. Log into your INTRA BOX account.<br />
                2. Navigate to <strong>Settings</strong> &gt; <strong>Profile</strong>.<br />
                3. Scroll to the bottom and click on <strong>Delete Account</strong>.<br />
                4. Confirm the deletion. Your data will be removed from our active servers within 48 hours.
              </p>
            </div>

            <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-6 rounded-r-lg">
              <h3 className="font-bold text-gray-900 mb-2">Option 2: Email Request</h3>
              <p className="text-gray-800">
                If you cannot access your account, please send an email to <a href="mailto:support@intrabox.com.ng" className="font-bold text-orange-600 hover:underline">support@intrabox.com.ng</a> with the subject line "Data Deletion Request". 
                Please include the email address associated with your account. We will process your request and confirm deletion within 7 business days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What Data Is Deleted?</h2>
            <p>When you request data deletion, we permanently remove:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your user profile information (Name, Email, Password).</li>
              <li>Your organization settings and configurations.</li>
              <li>Any stored credentials or access tokens for third-party platforms.</li>
              <li>Logs and analytics specifically tied to your individual user ID.</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500 italic">
              * Note: Some data may be retained in encrypted backups for a limited period or to comply with legal record-keeping requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Facebook Platform - Data Callback</h2>
            <p>
              INTRA BOX does not use an automated data deletion callback URL. We handle all deletion requests manually via the instructions above to ensure complete data removal across our infrastructure.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} INTRA BOX. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-600 hover:text-orange-500 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-600 hover:text-orange-500 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
