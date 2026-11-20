import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F2F0F1]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 items-end lg:grid-cols-12 gap-y-6 lg:gap-x-6 pt-8 sm:pt-14 lg:pt-16">
          {/* Left Column: Headline, subtext, CTA, Stats */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center pb-2 sm:pb-16 lg:pb-24 z-10">
            <h1 className="font-black text-[38px] sm:text-[56px] lg:text-[64px] leading-[0.95] sm:leading-[1.0] tracking-[-0.03em] text-black uppercase font-sans">
              FIND CLOTHES <br />
              THAT MATCHES <br />
              YOUR STYLE
            </h1>

            <p className="mt-5 sm:mt-8 max-w-[545px] text-sm sm:text-base text-black/60 leading-[22px] sm:leading-relaxed font-normal">
              Browse through our diverse range of meticulously crafted garments,
              designed to bring out your individuality and cater to your sense of
              style.
            </p>

            <div className="mt-6 sm:mt-9">
              <Link
                href="/products"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-black px-14 py-4 text-sm sm:text-base font-medium text-white transition-all hover:bg-black/85 text-center shadow-xs"
              >
                Shop Now
              </Link>
            </div>

            {/* Mobile Stats Counter (Exact 2-row layout from Figma) */}
            <div className="mt-7 sm:hidden">
              <div className="flex items-center justify-center">
                {/* 200+ */}
                <div className="flex-1 text-center pr-3 border-r border-black/10">
                  <p className="font-bold text-2xl text-black tracking-tight">
                    200+
                  </p>
                  <p className="text-[12px] text-black/60 mt-0.5 whitespace-nowrap">
                    International Brands
                  </p>
                </div>

                {/* 2,000+ */}
                <div className="flex-1 text-center pl-3">
                  <p className="font-bold text-2xl text-black tracking-tight">
                    2,000+
                  </p>
                  <p className="text-[12px] text-black/60 mt-0.5 whitespace-nowrap">
                    High-Quality Products
                  </p>
                </div>
              </div>

              {/* 30,000+ Centered Row */}
              <div className="text-center mt-3 pt-1">
                <p className="font-bold text-2xl text-black tracking-tight">
                  30,000+
                </p>
                <p className="text-[12px] text-black/60 mt-0.5">
                  Happy Customers
                </p>
              </div>
            </div>

            {/* Desktop Stats Counter */}
            <div className="hidden sm:flex flex-wrap items-center justify-start gap-y-4 mt-12 lg:mt-14">
              {/* Stat 1 */}
              <div className="pr-8 lg:pr-10 border-r border-black/10">
                <p className="font-bold text-3xl sm:text-4xl text-black tracking-tight">
                  200+
                </p>
                <p className="text-sm text-black/60 mt-0.5">
                  International Brands
                </p>
              </div>

              {/* Stat 2 */}
              <div className="px-8 lg:pr-10 border-r border-black/10">
                <p className="font-bold text-3xl sm:text-4xl text-black tracking-tight">
                  2,000+
                </p>
                <p className="text-sm text-black/60 mt-0.5">
                  High-Quality Products
                </p>
              </div>

              {/* Stat 3 */}
              <div className="pl-8 lg:pl-10">
                <p className="font-bold text-3xl sm:text-4xl text-black tracking-tight">
                  30,000+
                </p>
                <p className="text-sm text-black/60 mt-0.5">
                  Happy Customers
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Fashion Couple Image with Sparkle Stars */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex items-end justify-center lg:justify-end self-end mt-4 sm:mt-0">
            {/* Small Sparkle Star (Left of Woman) */}
            <div className="absolute left-4 sm:-left-4 lg:-left-8 top-[44%] -translate-y-1/2 z-20 text-black pointer-events-none">
              <svg
                className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14"
                viewBox="0 0 104 104"
                fill="currentColor"
              >
                <path d="M52 0C52 28.7188 28.7188 52 0 52C28.7188 52 52 75.2812 52 104C52 75.2812 75.2812 52 104 52C75.2812 52 52 28.7188 52 0Z" />
              </svg>
            </div>

            {/* Large Sparkle Star (Right of Man) */}
            <div className="absolute right-4 sm:right-6 lg:right-6 top-[14%] sm:top-6 z-20 text-black pointer-events-none">
              <svg
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                viewBox="0 0 104 104"
                fill="currentColor"
              >
                <path d="M52 0C52 28.7188 28.7188 52 0 52C28.7188 52 52 75.2812 52 104C52 75.2812 75.2812 52 104 52C75.2812 52 52 28.7188 52 0Z" />
              </svg>
            </div>

            {/* Model Couple Image */}
            <div className="relative w-full max-w-[460px] sm:max-w-[640px] lg:max-w-[720px] xl:max-w-[780px] aspect-[720/663] flex items-end">
              <Image
                src="/hero-right-image.png"
                alt="Find clothes that matches your style"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-contain object-bottom scale-100 sm:scale-105 lg:scale-105 origin-bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
