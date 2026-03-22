import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Privacy Policy – INTRA BOX',
  description: 'Privacy Policy for INTRA BOX, the unified customer communications platform.',
};

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: March 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>INTRA BOX ("we", "us", or "our") is committed to protecting the privacy of our users and their customers. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our platform. Please read this policy carefully.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and password when you register.</li>
              <li><strong>Customer Communication Data:</strong> Messages and conversation data from integrated channels (WhatsApp, Instagram, Facebook Messenger, Email) that your team manages through INTRA BOX.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with the platform, such as pages visited, features used, and session duration.</li>
              <li><strong>Device Information:</strong> Browser type, IP address, and operating system for security and analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Provide, operate, and maintain the INTRA BOX platform.</li>
              <li>Enable real-time communication routing between your team and your customers.</li>
              <li>Generate analytics and performance insights for your organization.</li>
              <li>Send service-related communications and important updates.</li>
              <li>Detect, prevent, and address fraud, security, or technical issues.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing and Third Parties</h2>
            <p>We do not sell your data to third parties. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Meta Platforms (Facebook, Instagram, WhatsApp):</strong> To enable message routing via their APIs, in accordance with Meta's Data Policy.</li>
              <li><strong>Infrastructure Providers:</strong> Cloud hosting and database services that process data on our behalf under strict confidentiality agreements.</li>
              <li><strong>Legal Authorities:</strong> When required by law, court order, or to protect our legal rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h2>
            <p>We retain your account and conversation data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Some data may be retained for legal compliance purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Security</h2>
            <p>We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest. However, no method of transmission or storage is 100% secure. We encourage you to use strong passwords and report any security concerns immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>The right to access the personal data we hold about you.</li>
              <li>The right to correct inaccurate or incomplete data.</li>
              <li>The right to request deletion of your data ("right to be forgotten").</li>
              <li>The right to restrict or object to certain processing of your data.</li>
              <li>The right to data portability.</li>
            </ul>
            <p className="mt-3">To exercise these rights, please contact us at <a href="mailto:support@intrabox.com.ng" className="text-orange-600 hover:underline font-medium">support@intrabox.com.ng</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p>We use cookies and similar tracking technologies to maintain your session, remember your preferences, and understand how you use our platform. You can control cookie preferences through your browser settings, though this may impact certain features.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children's Privacy</h2>
            <p>INTRA BOX is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected information from a minor, we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please reach out to us:</p>
            <address className="not-italic mt-3">
              <strong>INTRA BOX</strong><br />
              Ikeja, LAGOS STATE, NIGERIA<br />
              <a href="mailto:support@intrabox.com.ng" className="text-orange-600 hover:underline font-medium">support@intrabox.com.ng</a>
            </address>
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
