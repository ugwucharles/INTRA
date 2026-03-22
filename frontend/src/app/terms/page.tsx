import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms of Service – INTRA BOX',
  description: 'Terms of Service for INTRA BOX, the unified customer communications platform.',
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: March 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using INTRA BOX ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. These terms apply to all users, including businesses and their staff members.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p>INTRA BOX is a unified customer relationship management (CRM) platform that allows businesses to manage and respond to customer communications across multiple channels including WhatsApp, Instagram, Facebook Messenger, and Email from a single dashboard.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
            <p>To access the Service, you must register an account. You agree to provide accurate, complete, and current information during registration and to keep your account credentials confidential. You are responsible for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Send unsolicited messages, spam, or conduct phishing campaigns.</li>
              <li>Violate any applicable law or regulation, including consumer protection and privacy laws.</li>
              <li>Transmit harmful, offensive, or misleading content to your customers.</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts.</li>
              <li>Resell or sublicense the Service without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Integrations</h2>
            <p>INTRA BOX integrates with third-party platforms such as Meta (WhatsApp, Instagram, Facebook Messenger). Your use of those integrations is also subject to the respective platform's terms of service. We are not responsible for the availability or conduct of third-party services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data and Privacy</h2>
            <p>Your use of the Service is governed by our <Link href="/privacy" className="text-orange-600 hover:underline font-medium">Privacy Policy</Link>, which is incorporated into these Terms by reference. You are responsible for ensuring that your use of customer data through INTRA BOX complies with applicable data protection laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>All content, features, and functionality of INTRA BOX — including but not limited to the software, design, logos, and text — are owned by INTRA BOX and are protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our express written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our sole discretion if you violate these Terms. Upon termination, your right to access the Service will immediately cease. You may also terminate your account at any time by contacting support.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, INTRA BOX shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Service. Our total liability to you shall not exceed the amount you paid to us in the three months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of significant changes via email or a notice within the application. Continued use of the Service after changes constitutes your acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the Federal Republic of Nigeria, without regard to conflict of law provisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@intrabox.com.ng" className="text-orange-600 hover:underline font-medium">support@intrabox.com.ng</a>.</p>
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
