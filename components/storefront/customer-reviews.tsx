"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Check, Star } from "lucide-react";
import { CUSTOMER_REVIEWS } from "@/lib/mock-data";

function useWindowWidth() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => window.innerWidth,
    () => 1440
  );
}

export function CustomerReviewsSection() {
  const windowWidth = useWindowWidth();
  const L = CUSTOMER_REVIEWS.length;

  // Tripled list for seamless infinite looping
  const reviews = [...CUSTOMER_REVIEWS, ...CUSTOMER_REVIEWS, ...CUSTOMER_REVIEWS];

  // Start at middle set (index L)
  const [index, setIndex] = useState(L);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  // Responsive dimensions
  const isSmall = windowWidth < 640;
  const isMobile = windowWidth < 768;
  const cardWidth = isSmall
    ? Math.max(300, windowWidth - 32)
    : isMobile
    ? 350
    : 400;
  const gap = isSmall ? 16 : 20;
  const step = cardWidth + gap;

  // On desktop, center the second card of the visible trio (index + 1)
  // On mobile, center the primary active card (index)
  const centerIndex = isMobile ? index : index + 1;
  const translateX = windowWidth / 2 - (centerIndex * step + cardWidth / 2);

  // Autoplay timer
  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setIndex((prev) => prev + 1);
    }, 3500);

    return () => clearInterval(timer);
  }, [isHovered]);

  // Re-enable CSS transitions after silent jump
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Handle seamless wrap around at ends of cloned sets
  const handleTransitionEnd = () => {
    if (index >= 2 * L) {
      setIsTransitioning(false);
      setIndex((prev) => prev - L);
    } else if (index < L) {
      setIsTransitioning(false);
      setIndex((prev) => prev + L);
    }
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setIndex((prev) => prev - 1);
  };

  const handleNext = () => {
    setIsTransitioning(true);
    setIndex((prev) => prev + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (touchDeltaX.current > 50) {
      handlePrev();
    } else if (touchDeltaX.current < -50) {
      handleNext();
    }
  };

  return (
    <section className="py-14 sm:py-20 overflow-hidden w-full">
      {/* Header Container (Bounded to 1440px) */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 mb-8 sm:mb-10">
        <div className="flex items-end sm:items-center justify-between gap-4">
          <h2 className="font-black text-[32px] sm:text-5xl lg:text-[48px] leading-[36px] sm:leading-tight tracking-tighter text-black uppercase font-sans">
            OUR HAPPY <br className="sm:hidden" />
            CUSTOMERS
          </h2>

          {/* Minimalist Arrow Controls */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 pb-1 sm:pb-0">
            <button
              onClick={handlePrev}
              className="text-black hover:opacity-60 transition-opacity p-1 sm:p-2 cursor-pointer"
              aria-label="Previous review"
            >
              <ArrowLeft className="h-6 w-6 stroke-[2]" />
            </button>
            <button
              onClick={handleNext}
              className="text-black hover:opacity-60 transition-opacity p-1 sm:p-2 cursor-pointer"
              aria-label="Next review"
            >
              <ArrowRight className="h-6 w-6 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Full-Width Slider Track with Gradient Fades */}
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left edge gradient fade */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 lg:w-36 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />

        {/* Right edge gradient fade */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 lg:w-36 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Cards Row */}
        <div
          className="flex py-2"
          style={{
            transform: `translateX(${translateX}px)`,
            gap: `${gap}px`,
            transition: isTransitioning
              ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)"
              : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {reviews.map((review, i) => (
            <div
              key={`${review.id}-${i}`}
              style={{ width: `${cardWidth}px` }}
              className="shrink-0 min-h-[240px] rounded-[20px] border border-black/10 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* 5 Solid Gold Stars */}
                <div className="flex items-center gap-1 text-[#FFC633]">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className="h-5 w-5 fill-[#FFC633] text-[#FFC633]"
                    />
                  ))}
                </div>

                {/* Name + Verified Checkmark */}
                <div className="mt-3.5 sm:mt-4 flex items-center gap-1.5">
                  <span className="font-bold text-lg sm:text-[20px] text-black font-sans">
                    {review.name}
                  </span>
                  {review.verified && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#01AB31] text-white">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="mt-3 text-sm sm:text-base text-black/60 leading-relaxed font-sans">
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
