"use client";

import { useState } from "react";
import Link from "next/link";
import { StorefrontImage as Image } from "@/components/storefront/storefront-image";
import { ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { StarRating } from "./star-rating";
import { useCart } from "@/context/cart-context";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, loading, error } = useCart();
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "failed">("idle");

  const currentPrice = product.price;
  const originalPrice = product.originalPrice;
  const discountPercent =
    product.discountPercent ??
    (originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : undefined);

  return (
    <div className="group flex flex-col">
      {/* Product Image Frame */}
      <div className="relative aspect-[295/298] w-full overflow-hidden rounded-[14px] sm:rounded-[20px] bg-[#F0EEED] p-3 sm:p-6 flex items-center justify-center">
        <Link
          href={`/products/${product.slug}`}
          className="relative h-full w-full flex items-center justify-center"
        >
          <Image
            unoptimized
            src={product.thumbnail}
            alt={product.title}
            fill
            loading="eager"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-1.5 sm:p-2 transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Quick Add to Cart button on hover */}
        <button
          disabled={!product.inStock || loading || status === "adding"}
          onClick={async () => {
            setStatus("adding");
            setStatus(await addItem(product, 1) ? "added" : "failed");
          }}
          className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black text-white shadow-md disabled:opacity-40 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-all hover:scale-105 cursor-pointer"
          title="Add to Cart"
          aria-label="Add to cart"
        >
          <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Details */}
      <div className="mt-2.5 sm:mt-4 flex flex-col space-y-1 sm:space-y-1.5">
        <Link
          href={`/products/${product.slug}`}
          className="font-bold text-sm sm:text-base lg:text-[20px] text-black hover:text-black/70 transition-colors line-clamp-1 font-sans"
        >
          {product.title}
        </Link>

        {product.reviewsCount > 0 && <StarRating rating={product.rating} />}
        {status === "added" && <Link href="/cart" className="text-xs underline" role="status">Added · View cart</Link>}
        {status === "failed" && error && <span className="text-xs text-red-800" role="alert">{error}</span>}

        {/* Price Row */}
        <div className="flex items-center gap-1.5 sm:gap-3 pt-0.5 flex-wrap">
          <span className="font-bold text-base sm:text-xl lg:text-2xl text-black font-sans">
            ${currentPrice}
          </span>

          {originalPrice && (
            <span className="font-bold text-xs sm:text-lg lg:text-2xl text-black/40 line-through font-sans">
              ${originalPrice}
            </span>
          )}

          {Boolean(discountPercent && discountPercent > 0) && (
            <span className="rounded-full bg-[#FF3333]/10 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-[#FF3333]">
              -{discountPercent}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
