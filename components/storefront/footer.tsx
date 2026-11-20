import Link from "next/link";
import { NewsletterCTA } from "./newsletter-cta";

export function StorefrontFooter() {
  return (
    <footer className="relative mt-20 sm:mt-28">
      {/* Floating Newsletter Card (Overlaps page and footer) */}
      <div className="relative -mb-[140px] sm:-mb-24 z-20">
        <NewsletterCTA />
      </div>

      {/* Main Footer Container */}
      <div className="bg-[#F0F0F0] pt-44 sm:pt-36 pb-12 border-t border-zinc-200">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              <Link href="/">
                <span className="font-black text-[28px] sm:text-3xl tracking-tighter text-black font-sans uppercase">
                  SHOP.CO
                </span>
              </Link>
              <p className="max-w-xs text-sm text-black/60 leading-relaxed font-sans">
                We have clothes that suits your style and which you&apos;re proud
                to wear. From women to men.
              </p>

              {/* Social Media Links */}
              <div className="flex items-center gap-3 pt-1">
                {/* Twitter */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-200 bg-black text-white hover:opacity-80 transition-opacity"
                  aria-label="Facebook"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-black hover:bg-black hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Columns */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4 lg:col-span-8">
              {/* COMPANY */}
              <div className="space-y-3.5">
                <h3 className="font-medium text-sm uppercase tracking-[0.18em] text-black font-sans">
                  COMPANY
                </h3>
                <ul className="space-y-2.5 text-sm text-black/60 font-sans">
                  <li><Link href="/about" className="hover:text-black transition-colors">About</Link></li>
                  <li><Link href="/features" className="hover:text-black transition-colors">Features</Link></li>
                  <li><Link href="/works" className="hover:text-black transition-colors">Works</Link></li>
                  <li><Link href="/career" className="hover:text-black transition-colors">Career</Link></li>
                </ul>
              </div>

              {/* HELP */}
              <div className="space-y-3.5">
                <h3 className="font-medium text-sm uppercase tracking-[0.18em] text-black font-sans">
                  HELP
                </h3>
                <ul className="space-y-2.5 text-sm text-black/60 font-sans">
                  <li><Link href="/support" className="hover:text-black transition-colors">Customer Support</Link></li>
                  <li><Link href="/delivery" className="hover:text-black transition-colors">Delivery Details</Link></li>
                  <li><Link href="/terms" className="hover:text-black transition-colors">Terms & Conditions</Link></li>
                  <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>

              {/* FAQ */}
              <div className="space-y-3.5">
                <h3 className="font-medium text-sm uppercase tracking-[0.18em] text-black font-sans">
                  FAQ
                </h3>
                <ul className="space-y-2.5 text-sm text-black/60 font-sans">
                  <li><Link href="/account" className="hover:text-black transition-colors">Account</Link></li>
                  <li><Link href="/account/orders" className="hover:text-black transition-colors">Manage Deliveries</Link></li>
                  <li><Link href="/account/orders" className="hover:text-black transition-colors">Orders</Link></li>
                  <li><Link href="/payments" className="hover:text-black transition-colors">Payments</Link></li>
                </ul>
              </div>

              {/* RESOURCES */}
              <div className="space-y-3.5">
                <h3 className="font-medium text-sm uppercase tracking-[0.18em] text-black font-sans">
                  RESOURCES
                </h3>
                <ul className="space-y-2.5 text-sm text-black/60 font-sans">
                  <li><Link href="/ebooks" className="hover:text-black transition-colors">Free eBook</Link></li>
                  <li><Link href="/development" className="hover:text-black transition-colors">Development Tutorial</Link></li>
                  <li><Link href="/blog" className="hover:text-black transition-colors">How to - Blog</Link></li>
                  <li><Link href="/youtube" className="hover:text-black transition-colors">Youtube Playlist</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Payment Methods */}
          <div className="mt-10 sm:mt-16 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:pt-8 sm:flex-row">
            <p className="text-xs sm:text-sm text-black/60 text-center sm:text-left font-sans">
              Shop.co © 2000-2023, All Rights Reserved
            </p>

            {/* Payment Method Badges */}
            <div className="flex items-center justify-center gap-2.5">
              {/* Visa */}
              <div className="flex h-7 w-11 items-center justify-center rounded-sm bg-white shadow-xs border border-zinc-200">
                <span className="font-bold font-serif text-[11px] text-[#1A1F71] italic">
                  VISA
                </span>
              </div>

              {/* Mastercard */}
              <div className="flex h-7 w-11 items-center justify-center rounded-sm bg-white shadow-xs border border-zinc-200">
                <div className="flex -space-x-1.5">
                  <div className="h-4 w-4 rounded-full bg-[#EB001B] opacity-90" />
                  <div className="h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
                </div>
              </div>

              {/* PayPal */}
              <div className="flex h-7 w-11 items-center justify-center rounded-sm bg-white shadow-xs border border-zinc-200">
                <span className="font-bold text-[10px] text-[#003087]">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </span>
              </div>

              {/* Apple Pay */}
              <div className="flex h-7 w-11 items-center justify-center rounded-sm bg-white shadow-xs border border-zinc-200">
                <span className="font-medium text-[9px] text-black tracking-tight">
                  Pay
                </span>
              </div>

              {/* Google Pay */}
              <div className="flex h-7 w-11 items-center justify-center rounded-sm bg-white shadow-xs border border-zinc-200">
                <span className="font-medium text-[9px] text-zinc-700">
                  G Pay
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
