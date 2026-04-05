import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-gray-900 selection:bg-orange-100 relative" style={{background: 'radial-gradient(ellipse 80% 80% at 0% 0%, rgba(251,146,60,0.18) 0%, transparent 60%), #ffffff'}}>
      {/* Ambient Mesh Background */}
      <div aria-hidden className="pointer-events-none select-none absolute top-[-16rem] left-[-16rem] w-[48rem] h-[48rem] rounded-full" style={{background:'radial-gradient(circle, rgba(251,146,60,0.22) 0%, transparent 70%)', filter:'blur(80px)'}} />
      <div aria-hidden className="pointer-events-none select-none absolute top-[40%] right-[20%] w-[28rem] h-[28rem] rounded-full" style={{background:'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)', filter:'blur(60px)'}} />
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image src="/intra.logo.1.png" alt="INTRA Logo" width={100} height={30} className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-orange-50 to-white -z-10 rounded-3xl opacity-50 blur-3xl" />
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            Centralize Your Customers <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              In One Intelligent Box.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-500 mb-10">
            INTRA BOX gives your team a unified inbox, powerful omni-channel routing, and real-time CRM analytics. Connect WhatsApp, Messenger, and Email today.
          </p>
          
          <div className="flex justify-center gap-4 mb-20 relative z-10">
            <Link href="/register" className="px-8 py-3.5 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Start Free Trial
            </Link>
            <Link href="#features" className="px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-50 hover:border-gray-300 rounded-full transition-all flex items-center gap-2">
              Explore Features
            </Link>
          </div>

          {/* Browser Mockup window */}
          <div className="relative mx-auto max-w-5xl group cursor-default">
            {/* Glow effect behind mockup */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-200 to-red-200 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative rounded-2xl border border-gray-200/50 bg-white p-2 shadow-2xl ring-1 ring-gray-900/5 transition-transform duration-500 hover:scale-[1.01]">
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 relative">
                {/* Mac OS window controls mock */}
                <div className="absolute top-0 inset-x-0 h-10 bg-gray-100/90 backdrop-blur border-b border-gray-200 flex items-center px-4 gap-2 z-10">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 flex justify-center">
                    <div className="h-5 w-48 bg-white/60 rounded-md border border-gray-200/50 flex items-center justify-center">
                      <span className="text-[10px] text-gray-400 font-medium tracking-wide">app.intrabox.com</span>
                    </div>
                  </div>
                </div>
                {/* Image */}
                <div className="pt-10">
                  <Image
                    src="/dashboard-final.png"
                    alt="INTRA BOX Dashboard Interface"
                    width={1440}
                    height={900}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 relative inline-block">
              Everything you need to scale support
              <div className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-transparent opacity-50 rounded-full" />
            </h2>
            <p className="mt-6 text-lg text-gray-500">Built for modern businesses that care about their customers.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative w-full aspect-video mb-6 rounded-2xl overflow-hidden bg-orange-50/50">
                <Image src="/inbox-illustration.png" alt="Omnichannel Inbox" fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Omnichannel Inbox</h3>
              <p className="text-gray-500 leading-relaxed">
                Reply to WhatsApp, Instagram, Facebook Messenger, and Email from one single unified dashboard. Never lose track of a conversation again.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative w-full aspect-video mb-6 rounded-2xl overflow-hidden bg-blue-50/50">
                <Image src="/routing-illustration.png" alt="Smart Auto-Routing" fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Smart Auto-Routing</h3>
              <p className="text-gray-500 leading-relaxed">
                Route incoming messages to specific departments based on customer needs automatically. Enable auto-replies for after-hours support.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative w-full aspect-video mb-6 rounded-2xl overflow-hidden bg-green-50/50">
                <Image src="/analytics-illustration.png" alt="Enterprise Analytics" fill className="object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Enterprise Analytics</h3>
              <p className="text-gray-500 leading-relaxed">
                Measure team performance, response times, and resolution rates in real-time. Make data-driven decisions to scale your support.
              </p>
            </div>
          </div>

          {/* New Analytics Preview Block */}
          <div className="mt-32 flex flex-col md:flex-row items-center gap-16 text-left">
            <div className="flex-1">
              <span className="text-orange-600 font-bold text-sm tracking-widest uppercase">Data-Driven Insights</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-4 mb-6 leading-tight">
                Understand Every <br /> Customer Interaction.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                Our advanced analytics engine tracks everything from Average Response Time to team resolution rates. Get a bird’s-eye view of your entire customer operations in one beautiful dashboard.
              </p>
              <ul className="space-y-4">
                {['Resolution Rate Tracking', 'Average Response Time (Staff-wide)', 'Channel Volume Breakdown'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-[1.5] relative">
              <div className="absolute -inset-4 bg-orange-100/50 rounded-3xl blur-2xl -z-10" />
              <div className="rounded-2xl border border-gray-100 shadow-2xl overflow-hidden bg-white ring-1 ring-gray-900/5">
                <Image
                  src="/analytics-v2.png"
                  alt="INTRA Analytics Dashboard"
                  width={1440}
                  height={900}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Complies with Meta Guidelines) */}
      <footer className="bg-gray-50 border-t border-gray-200 py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/intra.logo.1.png" alt="INTRA Logo" width={80} height={24} className="h-6 w-auto mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              INTRA BOX is a modern, unified customer relationship management platform dedicated to centralizing your communications across all major channels globally.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider">Contact Details</h4>
            <address className="text-sm text-gray-600 not-italic space-y-3">
              <strong>INTRA BOX</strong><br />
              Ikeja, LAGOS STATE<br />
              NIGERIA<br />
              <br />
              <div className="flex flex-col gap-1">
                <a href="mailto:support@intrabox.com.ng" className="hover:text-orange-500 transition-colors">support@intrabox.com.ng</a>
              </div>
            </address>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link href="/terms" className="hover:text-orange-500 transition-colors flex items-center gap-1">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-500 transition-colors flex items-center gap-1">
                  Privacy Policy
                </Link>
              </li>

            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-8 border-t border-gray-200/60 flex justify-center">
          <p className="text-sm text-gray-500 text-center">© {new Date().getFullYear()} INTRA BOX Software. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
