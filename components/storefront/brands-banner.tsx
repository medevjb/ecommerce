import React from "react";

export function BrandsBanner() {
  return (
    <section id="brands" className="bg-black py-7 sm:py-12 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Mobile: Exact 2-row layout from Figma */}
        <div className="flex flex-col gap-y-4 sm:hidden">
          {/* Row 1: VERSACE, ZARA, GUCCI */}
          <div className="flex items-center justify-between px-2">
            <span className="font-serif font-black tracking-[0.16em] text-white text-[18px] uppercase select-none">
              VERSACE
            </span>
            <span className="font-serif font-black tracking-[-0.07em] text-white text-[27px] uppercase select-none">
              ZARA
            </span>
            <span className="font-serif font-bold tracking-[0.16em] text-white text-[18px] uppercase select-none">
              GUCCI
            </span>
          </div>

          {/* Row 2: PRADA, Calvin Klein */}
          <div className="flex items-center justify-center gap-8 px-2">
            <span className="font-serif font-black tracking-[0.14em] text-white text-[21px] uppercase select-none">
              PRADA
            </span>
            <span className="font-sans font-light tracking-[0.06em] text-white text-[18px] select-none">
              Calvin Klein
            </span>
          </div>
        </div>

        {/* Desktop: 1-row layout */}
        <div className="hidden sm:flex items-center justify-between gap-10 md:gap-16">
          {/* VERSACE */}
          <div className="flex items-center justify-center">
            <span className="font-serif font-black tracking-[0.2em] sm:tracking-[0.25em] text-white text-2xl sm:text-3xl lg:text-4xl uppercase select-none">
              VERSACE
            </span>
          </div>

          {/* ZARA */}
          <div className="flex items-center justify-center">
            <span className="font-serif font-black tracking-[-0.1em] text-white text-3xl sm:text-4xl lg:text-5xl uppercase select-none">
              ZARA
            </span>
          </div>

          {/* GUCCI */}
          <div className="flex items-center justify-center">
            <span className="font-serif font-bold tracking-[0.2em] text-white text-2xl sm:text-3xl lg:text-4xl uppercase select-none">
              GUCCI
            </span>
          </div>

          {/* PRADA */}
          <div className="flex items-center justify-center">
            <span className="font-serif font-black tracking-[0.16em] text-white text-2xl sm:text-3xl lg:text-4xl uppercase select-none">
              PRADA
            </span>
          </div>

          {/* Calvin Klein */}
          <div className="flex items-center justify-center">
            <span className="font-sans font-light tracking-[0.12em] text-white text-xl sm:text-2xl lg:text-3xl select-none">
              Calvin Klein
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
