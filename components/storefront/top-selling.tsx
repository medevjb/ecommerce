import Link from "next/link";
import { ProductCard } from "./product-card";
import type { Product } from "@/types";

export function TopSellingSection({ products, title }: { products: Product[]; title: string }) {
  return (
    <section id="top-selling" className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <h2 className="text-center font-black text-3xl sm:text-5xl lg:text-[48px] tracking-tighter text-black uppercase font-sans">
          {title}
        </h2>

        {/* 4 Product Cards Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 sm:mt-12 text-center">
          <Link
            href="/products?collection=top-selling"
            className="inline-flex w-full sm:w-[218px] items-center justify-center rounded-full border border-black/10 bg-white py-4 text-sm font-medium text-black transition-all hover:bg-black hover:text-white shadow-2xs"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
