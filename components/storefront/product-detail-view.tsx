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
  SlidersHorizontal,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { Product } from "@/types";
import { ProductCard } from "./product-card";
import { useCart } from "@/context/cart-context";
import type { CatalogReview } from "@/lib/catalog";

interface ProductDetailViewProps {
  product: Product;
  related: Product[];
  reviews: CatalogReview[];
}

export function ProductDetailView({ product, related, reviews }: ProductDetailViewProps) {
  const { addItem, error:cartError } = useCart();

  // Images for gallery
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail];
  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  const defaultColors = product.colors ?? [];
  const defaultSizes = product.sizes ?? [];
  const first = product.variants?.find((variant) => variant.stock > 0);
  const [selectedColor, setSelectedColor] = useState(first?.attributes.color ?? defaultColors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(first?.attributes.size ?? defaultSizes[0] ?? "");
  const variant = product.variants?.find((item) => (item.attributes.color ?? "") === selectedColor && (item.attributes.size ?? "") === selectedSize);
  const purchasable = Boolean(variant && variant.stock > 0);

  // Quantity selection
  const [quantity, setQuantity] = useState(1);

  // Active Tab: "details" | "reviews" | "faqs"
  const [activeTab, setActiveTab] = useState<"details" | "reviews" | "faqs">(
    "reviews"
  );

  const activeReviews = reviews;
  const activeRelated = related;
  const displayRating = product.rating;
  const displayReviewsCount = product.reviewsCount;

  // Reviews state (show 3 on mobile initially, can load more)
  const [visibleCount, setVisibleCount] = useState(3);
  const [addedToast, setAddedToast] = useState(false);

  const currentPrice = variant?.price ?? product.price;
  const originalPrice = product.originalPrice;
  const discountPercent = product.discountPercent ?? 40;

  const handleAddToCart = async () => {
    if (!variant || !purchasable) return;
    if (!(await addItem({ ...product, price:currentPrice }, quantity, variant.id, variant.attributes))) return;
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

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
        <span className="text-black font-medium">{product.category.name}</span>
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
              ${currentPrice}
            </span>
            {originalPrice && (
              <span className="font-bold text-2xl sm:text-3xl text-black/40 line-through font-sans">
                ${originalPrice}
              </span>
            )}
            {discountPercent && (
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

          {/* Select Colors */}
          <div>
            <span className="text-sm sm:text-base text-black/60 font-sans block mb-3.5">
              Select Colors
            </span>
            <div className="flex items-center gap-3.5">
              {defaultColors.map((color) => {
                const isSelected = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    style={{ backgroundColor: color.hex }}
                    className="relative h-9 w-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs"
                    title={color.name}
                    aria-label={`Select ${color.name} color`}
                  >
                    {isSelected && (
                      <Check className="h-4 w-4 text-white stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black/10 my-6" />

          {/* Choose Size */}
          <div>
            <span className="text-sm sm:text-base text-black/60 font-sans block mb-3.5">
              Choose Size
            </span>
            <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {defaultSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full py-2.5 sm:py-3 px-2 sm:px-6 text-xs sm:text-sm font-medium font-sans transition-all cursor-pointer text-center flex items-center justify-center ${
                      isSelected
                        ? "bg-black text-white"
                        : "bg-[#F0F0F0] text-black/60 hover:bg-[#e6e6e6]"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black/10 my-6" />

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
                onClick={() => setQuantity((prev) => prev + 1)}
                className="text-black hover:opacity-60 transition-opacity p-0.5 cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart} disabled={!purchasable}
              className="flex-1 rounded-full bg-black py-3 sm:py-4 px-4 sm:px-8 text-center text-xs sm:text-base font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] cursor-pointer shadow-xs"
            >
              {purchasable ? "Add to Cart" : "Unavailable"}
            </button>
          </div>

          {/* Added to cart toast feedback */}
          {addedToast && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs sm:text-sm font-medium text-emerald-800 transition-all">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Added to your shopping cart!</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <div className="grid grid-cols-3 border-b border-black/10 mt-12 sm:mt-20 text-center">
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

        <button
          onClick={() => setActiveTab("faqs")}
          className={`pb-3 sm:pb-5 text-xs sm:text-lg lg:text-xl font-sans transition-colors cursor-pointer ${
            activeTab === "faqs"
              ? "font-medium text-black border-b-2 border-black"
              : "font-normal text-black/60 hover:text-black"
          }`}
        >
          FAQs
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
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Filter Button */}
              <button
                className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#F0F0F0] text-black hover:bg-[#e6e6e6] transition-colors cursor-pointer shrink-0"
                aria-label="Filter reviews"
              >
                <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Sort Dropdown (hidden on mobile to match design) */}
              <button
                className="hidden sm:flex items-center gap-1 sm:gap-2 rounded-full bg-[#F0F0F0] px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium text-black hover:bg-[#e6e6e6] transition-colors cursor-pointer"
                aria-label="Sort reviews"
              >
                <span>Latest</span>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
              </button>

              {/* Write a Review Button */}
              <button
                className="rounded-full bg-black px-4 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white transition-all hover:bg-black/85 cursor-pointer shadow-xs whitespace-nowrap"
              >
                Write a Review
              </button>
            </div>
          </div>

          {/* Reviews Grid (1 col on mobile, 2 cols on md) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-6 sm:mt-8">
            {activeReviews.length===0&&<p className="text-sm text-zinc-600">No approved reviews yet.</p>}
            {activeReviews.slice(0, visibleCount).map(
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

                      <button
                        className="text-black/40 hover:text-black transition-colors p-1"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
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

          {activeReviews.length > visibleCount && (
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
          <ul className="list-disc pl-5 space-y-2 pt-2">
            <li>100% Combed ringspun cotton (240 GSM heavyweight feel)</li>
            <li>Reinforced double-needle collar and hem stitching</li>
            <li>Pre-shrunk fabric to retain shape across repeated washes</li>
            <li>Standard relaxed streetwear silhouette with drop shoulders</li>
          </ul>
        </div>
      )}

      {/* Tab Content: FAQs */}
      {activeTab === "faqs" && (
        <div className="mt-8 sm:mt-10 max-w-3xl space-y-4 font-sans">
          <div className="rounded-[16px] border border-black/10 p-5 bg-white">
            <h3 className="font-bold text-base text-black">
              What is the sizing fit like?
            </h3>
            <p className="mt-2 text-sm text-black/60 leading-relaxed">
              This t-shirt features a true-to-size relaxed boxy cut. If you
              prefer an oversized streetwear look, we recommend sizing up one
              size.
            </p>
          </div>
          <div className="rounded-[16px] border border-black/10 p-5 bg-white">
            <h3 className="font-bold text-base text-black">
              How should I wash and care for this garment?
            </h3>
            <p className="mt-2 text-sm text-black/60 leading-relaxed">
              Machine wash cold inside-out with like colors. Hang dry or tumble
              dry low. Do not iron directly on the graphic print.
            </p>
          </div>
        </div>
      )}

      {/* 4. "YOU MIGHT ALSO LIKE" Section */}
      <section className="mt-14 sm:mt-24">
        <h2 className="text-center font-black text-[32px] sm:text-5xl lg:text-[48px] leading-[36px] sm:leading-tight tracking-tighter text-black uppercase font-sans mb-8 sm:mb-14">
          YOU MIGHT <br className="sm:hidden" />
          ALSO LIKE
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {activeRelated.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
}
