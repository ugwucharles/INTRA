import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Image src="/intra-logo-new.png" alt="INTRA" width={56} height={18} className="h-[18px] w-auto" />
            <p className="mt-4 max-w-xs text-sm text-neutral-600 leading-relaxed">
              One intelligent inbox for WhatsApp, Messenger, and Instagram.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-950 mb-4">Product</p>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li><a href="#features" className="hover:text-neutral-950 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-neutral-950 transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-neutral-950 transition-colors">FAQs</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-950 mb-4">Legal</p>
            <ul className="space-y-3 text-sm text-neutral-600">
              <li><Link href="/terms" className="hover:text-neutral-950 transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-neutral-950 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/data-deletion" className="hover:text-neutral-950 transition-colors">Data deletion</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-neutral-200 flex justify-center">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} INTRA BOX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
