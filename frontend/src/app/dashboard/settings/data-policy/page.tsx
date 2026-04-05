'use client';

import React from 'react';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

export default function DataDeletionPolicyPage() {
  const router = useRouter();
  const lastUpdated = 'March 29, 2026';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-full overflow-y-auto bg-[#FFFCF1]/50">
          <div className="max-w-3xl mx-auto px-8 py-10">
            {/* Back button */}
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Settings
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Data Deletion Policy</h1>
            <p className="text-sm text-gray-400 mb-10">Last updated: {lastUpdated}</p>

            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">1. Overview</h2>
                <p>
                  <strong>Intra</strong> ("the Platform", "we", "us") is committed to protecting your privacy and respecting your right to control your personal data. This policy outlines what data we collect, how it is stored, and the procedures for permanently deleting your data upon request.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">2. Data We Collect</h2>
                <p>As part of normal platform operation, we collect and store the following categories of data:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1">
                  <li><strong>Organization Data:</strong> Organization name, country, phone number, and address.</li>
                  <li><strong>Staff Profiles:</strong> Name, email, role, profile picture, and activity status.</li>
                  <li><strong>Customer Data:</strong> Names, email addresses, phone numbers, and social media identifiers linked to conversations.</li>
                  <li><strong>Conversations &amp; Messages:</strong> Full conversation threads, timestamps, and message content.</li>
                  <li><strong>Channel Integrations:</strong> Access tokens and page IDs for connected platforms (Facebook, Instagram, WhatsApp, Email).</li>
                  <li><strong>Analytics &amp; Logs:</strong> Audit logs for key actions (assignments, closures, status changes).</li>
                  <li><strong>Routing &amp; Automation Settings:</strong> Department configurations, auto-reply rules, and routing preferences.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">3. How to Delete Your Data</h2>
                <p>
                  You can permanently delete all data associated with your organization at any time. This includes all conversations, customers, staff accounts, channel integrations, and configuration settings.
                </p>

                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                  <p className="font-semibold mb-1">⚠️ This action is irreversible</p>
                  <p className="text-xs">Once you delete your organization, all data is permanently removed from our servers. This cannot be undone. We recommend exporting any important data before proceeding.</p>
                </div>

                <div className="mt-4 space-y-3">
                  <p className="font-medium">To delete your organization and all data:</p>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Navigate to <strong>Settings</strong> from the sidebar.</li>
                    <li>Scroll down to the <strong>Danger Zone</strong> section (visible to Account Admins only).</li>
                    <li>Click <strong>"Delete Organization"</strong> and confirm when prompted.</li>
                    <li>You will be automatically signed out. All data is removed within seconds.</li>
                  </ol>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">4. What Gets Deleted</h2>
                <p>The following data is permanently deleted when you initiate organization deletion:</p>
                <ul className="list-disc pl-6 mt-3 space-y-1">
                  <li>All messages and conversation threads</li>
                  <li>All customer contact records and notes</li>
                  <li>All staff accounts and profiles within the organization</li>
                  <li>All connected channel credentials (access tokens, page IDs)</li>
                  <li>All routing rules, auto-replies, and business hours configurations</li>
                  <li>All saved replies, tags, and department structures</li>
                  <li>All audit logs and analytics data</li>
                  <li>The organization record itself</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">5. Facebook / Meta Data Deletion</h2>
                <p>
                  If you connected a Facebook Page or Instagram Business Account through Intra, you can also request data deletion directly via Facebook. To do so:
                </p>
                <ol className="list-decimal pl-6 mt-3 space-y-2">
                  <li>Open your <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook App Settings</a>.</li>
                  <li>Locate <strong>Intra</strong> in the list of connected apps.</li>
                  <li>Click <strong>Remove</strong> or <strong>Delete Activity</strong>.</li>
                  <li>Facebook will send a deletion request to Intra. We will process it within 30 days.</li>
                </ol>
                <p className="mt-3">
                  Alternatively, email us at <strong>support@intrabox.com.ng</strong> with the subject line <em>"Data Deletion Request"</em> and we will handle it manually within 30 days.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Retention</h2>
                <p>
                  We do not retain any personal data beyond the point of deletion. Once triggered, the deletion is immediate and permanent. We do not keep backups of deleted organizations.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">7. Contact Us</h2>
                <p>
                  If you have any questions about this policy or need assistance with data deletion, please contact us:
                </p>
                <ul className="list-none mt-3 space-y-1">
                  <li>📧 <strong>Email:</strong> support@intrabox.com.ng</li>
                  <li>🌐 <strong>Website:</strong> <a href="https://intrabox.com.ng" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">intrabox.com.ng</a></li>
                </ul>
              </section>

            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} Intra. All rights reserved.
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
