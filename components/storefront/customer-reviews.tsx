"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

type Testimonial = {
  id: string;
  data: { author?: string; quote?: string; rating?: number | string | null };
};

export function CustomerReviewsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  if (!testimonials.length) return null;

  function move(direction: -1 | 1) {
    const list = track.current;
    if (!list) return;

    const [first, second] = list.children;
    if (!(first instanceof HTMLElement) || !(second instanceof HTMLElement)) return;
    const end = list.scrollWidth - list.clientWidth;
    const step = second.offsetLeft - first.offsetLeft;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    const left = direction > 0 && list.scrollLeft >= end - 2 ? 0
      : direction < 0 && list.scrollLeft <= 2 ? end
      : Math.max(0, Math.min(end, list.scrollLeft + direction * step));

    list.scrollTo({ left, behavior });
  }

  const arrow = "grid size-10 place-items-center rounded-full text-black hover:bg-zinc-100 focus-visible:outline-2";

  return <section className="mx-auto w-full max-w-[1440px] py-14 pl-5 sm:py-20 sm:pl-10" aria-labelledby="happy-customers">
    <div className="mb-6 flex items-end justify-between gap-3 pr-5 sm:mb-9 sm:pr-10">
      <h2 id="happy-customers" className="text-3xl font-black uppercase leading-none tracking-tighter sm:text-5xl">Our Happy Customers</h2>
      {testimonials.length > 1 && <div className="flex shrink-0 gap-1">
        <button type="button" className={arrow} onClick={() => move(-1)} aria-label="Previous testimonial"><ArrowLeft size={22} /></button>
        <button type="button" className={arrow} onClick={() => move(1)} aria-label="Next testimonial"><ArrowRight size={22} /></button>
      </div>}
    </div>
    <ul ref={track} className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pr-5 pr-5 sm:scroll-pr-10 sm:pr-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
      {testimonials.map(({ id, data }) => {
        const rating = Number(data.rating);
        return <li key={id} className="min-h-44 basis-[88%] shrink-0 snap-start rounded-[20px] border border-zinc-200 px-5 py-6 sm:basis-[calc((100%-1rem)/2)] md:min-h-52 md:px-7 md:py-7 lg:basis-[calc((100%-2rem)/3)]">
          {Number.isInteger(rating) && rating >= 1 && rating <= 5 && <div className="mb-3 flex gap-1 text-amber-400" aria-label={`Rated ${rating} out of 5 stars`} role="img">
            {Array.from({ length: 5 }, (_, index) => <Star key={index} size={17} aria-hidden className={index < rating ? "fill-current" : "text-zinc-200"} />)}
          </div>}
          <figure>
            <figcaption className="font-bold">{data.author}</figcaption>
            <blockquote className="mt-2 text-sm leading-relaxed text-zinc-600">“{data.quote}”</blockquote>
          </figure>
        </li>;
      })}
    </ul>
  </section>;
}
