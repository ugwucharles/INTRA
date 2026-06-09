import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="kinso-dark-grid border-t border-white/5 text-white">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Image src="/intra-logo-new.png" alt="INTRA" width={56} height={18} className="h-[18px] w-auto brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm text-neutral-400 leading-relaxed">
              One intelligent inbox for WhatsApp, Messenger, Instagram, and email.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-4">Product</p>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-4">Legal</p>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/data-deletion" className="hover:text-white transition-colors">Data deletion</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-14 text-xs text-neutral-500">© {new Date().getFullYear()} INTRA BOX. All rights reserved.</p>
      </div>
    </footer>
  );
}
