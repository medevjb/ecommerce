"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  Check,
  Star,
} from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "./product-card";
import { useCart } from "@/context/cart-context";
import type { CatalogReview } from "@/lib/catalog";
import { usd } from "@/lib/staff-api";

interface ProductDetailViewProps {
  product: Product;
  related: Product[];
  reviews: CatalogReview[];
}

export function ProductDetailView({ product, related, reviews }: ProductDetailViewProps) {
  const { addItem, error:cartError, loading } = useCart();

  // Images for gallery
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  const variants = product.variants ?? [];
  const defaultVariant = variants.find((item) => item.isDefault && item.stock > 0)
    ?? variants.find((item) => item.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(defaultVariant?.id);
  const variant = variants.find((item) => item.id === variantId);
  const purchasable = Boolean(variant && variant.stock > 0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [visibleCount, setVisibleCount] = useState(3);
  const [addedToast, setAddedToast] = useState(false);
  const [adding, setAdding] = useState(false);
  const displayRating = product.rating;
  const displayReviewsCount = product.reviewsCount;
  const currentPrice = variant?.price ?? product.price;
  const originalPrice = variant ? variant.originalPrice : product.originalPrice;
  const discountPercent = originalPrice ? Math.round(100 * (originalPrice - currentPrice) / originalPrice) : 0;

  async function handleAddToCart() {
    if (!variant || !purchasable || adding || loading) return;
    setAdding(true);
    setAddedToast(false);
    try {
      setAddedToast(await addItem(product, quantity, variant.id));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pb-20">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-black/60 pt-4 pb-6 sm:pt-6 sm:pb-9 font-sans">
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/40" />
        <Link href="/products" className="hover:text-black transition-colors">
          Shop
        </Link>
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/40" />
        <Link href="/products?category=men" className="hover:text-black transition-colors">
          Men
        </Link>
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/40" />
        <span className="text-black font-medium">
          {product.category?.name === "T Shirts" ? "T-shirts" : (product.category?.name || "T-shirts")}
        </span>
      </nav>

      {cartError && <p className="mb-4 text-sm text-red-800" role="alert">{cartError}</p>}
      {/* 2. Top Product Showcase: Gallery + Details */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Gallery Column (Desktop: 3 Vertical Thumbs on left + Big Preview on right) */}
        <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4.5">
          {/* Thumbnails */}
          <div className="grid grid-cols-3 gap-3 w-full sm:flex sm:flex-col sm:w-[142px] lg:w-[152px] sm:shrink-0">
            {galleryImages.map((img, idx) => {
              const isActive = activeImage === img;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-[111/106] sm:aspect-[152/167] w-full sm:w-[142px] lg:w-[152px] h-[106px] sm:h-[155px] lg:h-[167px] rounded-[16px] sm:rounded-[20px] bg-[#F0EEED] p-2 overflow-hidden transition-all cursor-pointer ${
                    isActive
                      ? "ring-2 ring-black"
                      : "border border-transparent hover:opacity-85"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    unoptimized
                    src={img}
                    alt={`${product.title} thumb ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 33vw, 152px"
                    className="object-contain p-1"
                  />
                </button>
              );
            })}
          </div>

          {/* Main Large Image */}
          <div className="relative aspect-[358/290] sm:aspect-[444/530] w-full flex-1 rounded-[20px] bg-[#F0EEED] p-4 sm:p-6 overflow-hidden flex items-center justify-center">
            <Image
              unoptimized
              src={activeImage}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 444px"
              className="object-contain p-3 sm:p-4 transition-all duration-300"
              priority
            />
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-6 flex flex-col justify-start">
          {/* Product Title */}
          <h1 className="font-black text-2xl sm:text-4xl lg:text-[40px] uppercase font-sans tracking-tight text-black leading-tight">
            {product.title}
          </h1>

          {/* Star Rating */}
          <div className="mt-3 sm:mt-3.5 flex items-center gap-2">
            <div className="flex items-center gap-0.5 text-[#FFC633]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(displayRating)
                      ? "fill-[#FFC633] text-[#FFC633]"
                      : i < displayRating
                      ? "fill-[#FFC633] text-[#FFC633] opacity-80"
                      : "text-zinc-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-black font-sans">
              {displayRating}/
              <span className="text-black/40">5</span>
            </span>
          </div>

          {/* Price Row */}
          <div className="mt-3.5 sm:mt-4 flex items-center gap-3">
            <span className="font-bold text-2xl sm:text-3xl text-black font-sans">
              {usd.format(currentPrice)}
            </span>
            {originalPrice && (
              <span className="font-bold text-2xl sm:text-3xl text-black/40 line-through font-sans">
                {usd.format(originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-full bg-[#FF3333]/10 px-3.5 py-1 text-sm font-semibold text-[#FF3333]">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Description */}
          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base text-black/60 leading-relaxed font-sans">
            {product.description}
          </p>

          {/* Divider */}
          <div className="border-t border-black/10 my-6" />

          {variants.some((item) => item.name) && (
            <label className="mb-6 block text-sm font-medium">
              {product.variantLabel ?? "Options"}
              <select
                className="mt-2 block w-full rounded-xl border border-black/20 p-3"
                value={variantId}
                disabled={adding}
                onChange={(event) => {
                  setVariantId(event.target.value);
                  setQuantity(1);
                  setAddedToast(false);
                }}
              >
                {variants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.sku}{item.stock > 0 ? "" : " (out of stock)"}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Quantity Selector + Add to Cart */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quantity Pill */}
            <div className="flex items-center justify-between rounded-full bg-[#F0F0F0] px-4 sm:px-5 py-3 sm:py-4 w-[110px] sm:w-[170px] shrink-0">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="text-black hover:opacity-60 transition-opacity p-0.5 cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 sm:h-5 w-4 sm:w-5 stroke-[2.5]" />
              </button>
              <span className="font-bold text-sm sm:text-lg text-black font-sans">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                disabled={!purchasable || quantity >= 99 || adding}
                className="text-black hover:opacity-60 transition-opacity p-0.5 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart} disabled={!purchasable || adding || loading}
              className="flex-1 rounded-full bg-black py-3 sm:py-4 px-4 sm:px-8 text-center text-xs sm:text-base font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] cursor-pointer shadow-xs"
            >
              {adding ? "Adding…" : purchasable ? "Add to Cart" : "Unavailable"}
            </button>
          </div>

          {/* Added to cart toast feedback */}
          {addedToast && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-800 transition-all">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span role="status">Added to your cart.</span>
              <Link href="/cart" className="ml-auto underline">View cart</Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="grid grid-cols-2 border-b border-black/10 mt-12 sm:mt-20 text-center">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-3 sm:pb-5 text-xs sm:text-lg lg:text-xl font-sans transition-colors cursor-pointer ${
            activeTab === "details"
              ? "font-medium text-black border-b-2 border-black"
              : "font-normal text-black/60 hover:text-black"
          }`}
        >
          Product Details
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 sm:pb-5 text-xs sm:text-lg lg:text-xl font-sans transition-colors cursor-pointer ${
            activeTab === "reviews"
              ? "font-medium text-black border-b-2 border-black"
              : "font-normal text-black/60 hover:text-black"
          }`}
        >
          Rating & Reviews
        </button>

      </div>

      {/* Tab Content: Rating & Reviews (Default Tab in Screenshot) */}
      {activeTab === "reviews" && (
        <div className="mt-6 sm:mt-10">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <h2 className="font-bold text-lg sm:text-2xl text-black font-sans">
                All Reviews
              </h2>
              <span className="text-xs sm:text-sm font-normal text-black/60 font-sans">
                ({displayReviewsCount})
              </span>
            </div>

            {/* Actions: Filter, Sort, Write a Review */}
          </div>

          {/* Reviews Grid (1 col on mobile, 2 cols on md) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-6 sm:mt-8">
            {reviews.length===0&&<p className="text-sm text-zinc-600">No approved reviews yet.</p>}
            {reviews.slice(0, visibleCount).map(
              (review) => (
                <div
                  key={review.id}
                  className="rounded-[20px] border border-black/10 bg-white p-6 sm:p-7 relative flex flex-col justify-between shadow-xs"
                >
                  <div>
                    {/* Rating + Top-right Menu */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[#FFC633]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(review.rating)
                                ? "fill-[#FFC633] text-[#FFC633]"
                                : i < review.rating
                                ? "fill-[#FFC633] text-[#FFC633] opacity-80"
                                : "text-zinc-300"
                            }`}
                          />
                        ))}
                      </div>

                    </div>

                    {/* Author Name + Verified Badge */}
                    <div className="mt-3.5 sm:mt-4 flex items-center gap-1.5">
                      <span className="font-bold text-lg sm:text-[19px] text-black font-sans">
                        {review.title || "Customer review"}
                      </span>
                      {review.verified_purchase && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#01AB31] text-white">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Review Comment */}
                    <p className="mt-3 text-sm sm:text-base text-black/60 leading-relaxed font-sans">
                      {review.body}
                    </p>
                  </div>

                  {/* Date Stamp */}
                  <span className="mt-5 text-xs sm:text-sm text-black/40 font-medium font-sans">
                    Posted on{" "}
                    {review.created_at.includes("T")
                      ? new Date(review.created_at).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : review.created_at}
                  </span>
                </div>
              )
            )}
          </div>

          {reviews.length > visibleCount && (
            <div className="mt-9 sm:mt-11 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 3)}
                className="inline-flex rounded-full border border-black/10 bg-white px-10 sm:px-12 py-3.5 text-sm font-medium text-black hover:bg-black hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Product Details */}
      {activeTab === "details" && (
        <div className="mt-8 sm:mt-10 max-w-3xl space-y-4 text-black/70 font-sans leading-relaxed">
          <p>{product.description}</p>
        </div>
      )}

      {/* 4. "YOU MIGHT ALSO LIKE" Section */}
      {related.length > 0 && <section className="mt-14 sm:mt-24">
        <h2 className="text-center font-black text-[32px] sm:text-5xl lg:text-[48px] leading-[36px] sm:leading-tight tracking-tighter text-black uppercase font-sans mb-8 sm:mb-14">
          YOU MIGHT <br className="sm:hidden" />
          ALSO LIKE
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {related.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>}
    </div>
  );
}
