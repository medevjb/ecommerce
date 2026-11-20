import Link from "next/link";
import Image from "next/image";
import { DRESS_STYLES } from "@/lib/mock-data";

export function DressStyleSection() {
  const [casual, formal, party, gym] = DRESS_STYLES;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Main Light Gray Container */}
        <div className="rounded-[24px] sm:rounded-[40px] bg-[#F0F0F0] px-4 py-8 sm:px-12 sm:py-16 lg:px-16 lg:py-18">
          {/* Section Heading */}
          <h2 className="text-center font-black text-[32px] sm:text-5xl lg:text-[48px] tracking-tighter text-black uppercase font-sans mb-7 sm:mb-14 lg:mb-16 leading-[36px] sm:leading-tight">
            BROWSE BY <br className="sm:hidden" />
            DRESS STYLE
          </h2>

          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Row 1: Casual (Narrow: 407px) + Formal (Wide: 684px) */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
              {/* Casual */}
              <Link
                href={`/products?style=${casual.slug}`}
                className="group relative h-[190px] sm:h-[240px] md:h-[289px] w-full md:w-[37.3%] overflow-hidden rounded-[20px] bg-white transition-all hover:shadow-md block shrink-0 md:grow-0"
              >
                <span className="absolute left-6 top-5 sm:left-9 sm:top-6 z-10 font-bold text-2xl sm:text-3xl md:text-[36px] text-black font-sans tracking-tight">
                  {casual.title}
                </span>
                <div className="absolute right-0 top-0 h-full w-[70%] sm:w-full">
                  <Image
                    src={casual.image}
                    alt={casual.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover object-right transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>

              {/* Formal */}
              <Link
                href={`/products?style=${formal.slug}`}
                className="group relative h-[190px] sm:h-[240px] md:h-[289px] w-full md:flex-1 overflow-hidden rounded-[20px] bg-white transition-all hover:shadow-md block"
              >
                <span className="absolute left-6 top-5 sm:left-9 sm:top-6 z-10 font-bold text-2xl sm:text-3xl md:text-[36px] text-black font-sans tracking-tight">
                  {formal.title}
                </span>
                <div className="absolute right-0 top-0 h-full w-[85%] sm:w-full">
                  <Image
                    src={formal.image}
                    alt={formal.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover object-[85%_top] sm:object-right transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Row 2: Party (Wide: 684px / 642px) + Gym (Narrow: 407px / 354px) */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-5">
              {/* Party */}
              <Link
                href={`/products?style=${party.slug}`}
                className="group relative h-[190px] sm:h-[240px] md:h-[289px] w-full md:flex-1 overflow-hidden rounded-[20px] bg-white transition-all hover:shadow-md block"
              >
                <span className="absolute left-6 top-5 sm:left-9 sm:top-6 z-10 font-bold text-2xl sm:text-3xl md:text-[36px] text-black font-sans tracking-tight">
                  {party.title}
                </span>
                <div className="absolute right-0 top-0 h-full w-[85%] sm:w-full">
                  <Image
                    src={party.image}
                    alt={party.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="object-cover object-[70%_center] sm:object-right transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>

              {/* Gym */}
              <Link
                href={`/products?style=${gym.slug}`}
                className="group relative h-[190px] sm:h-[240px] md:h-[289px] w-full md:w-[37.3%] overflow-hidden rounded-[20px] bg-white transition-all hover:shadow-md block shrink-0 md:grow-0"
              >
                <span className="absolute left-6 top-5 sm:left-9 sm:top-6 z-10 font-bold text-2xl sm:text-3xl md:text-[36px] text-black font-sans tracking-tight">
                  {gym.title}
                </span>
                <div className="absolute right-0 top-0 h-full w-[80%] sm:w-full">
                  <Image
                    src={gym.image}
                    alt={gym.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover object-[85%_top] sm:object-right transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
