"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { usd, human } from "@/lib/staff-api";
import { useCart } from "@/context/cart-context";

export function CartPageView() {
  const {
    items,
    error,
    loading,
    removeItem,
    updateQuantity,
    subtotal,
    discountPercent,
    discountAmount,
    blocked,
    clearCart,
    total,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [updating, setUpdating] = useState(false);
  async function update(action: () => Promise<void>) {
    setUpdating(true);
    try { await action(); } finally { setUpdating(false); }
  }

  const [inputCode, setInputCode] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim() || updating) return;
    setUpdating(true);
    const res = await applyPromoCode(inputCode.trim()).finally(() => setUpdating(false));
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setInputCode("");
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  return (
    <div className="bg-white pb-12 sm:pb-20">
      {/* Outer 1440px Container */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
        {loading && <p role="status">Loading cart…</p>}
        {error && <p role="alert" className="my-3 text-red-800">{error}</p>}
        {/* Breadcrumb: Home > Cart */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs sm:text-sm text-black/60 pb-4 sm:pb-6"
        >
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/40" />
          <span className="text-black font-medium">Cart</span>
        </nav>

        {/* Page Title: YOUR CART */}
        <h1 className="font-black text-2xl sm:text-4xl lg:text-[40px] uppercase font-sans tracking-tight text-black mb-5 sm:mb-8">
          YOUR CART
        </h1>

        {items.length === 0 ? (
          !loading && !error && <div className="rounded-[20px] border border-black/10 bg-white p-8 sm:p-12 text-center my-6">
            <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#F0EEED] text-black">
              <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h2 className="font-bold text-xl sm:text-2xl text-black mb-2 font-sans">
              Your cart is empty
            </h2>
            <p className="text-black/60 max-w-md mx-auto mb-6 text-xs sm:text-base">
              Looks like you haven&apos;t added any items to your cart yet. Browse our collection and find your style!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-black/80"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-7 xl:col-span-7">
              <button type="button" className="mb-3 text-sm underline" disabled={updating} onClick={() => update(clearCart)}>Clear cart</button>
              <div className="rounded-[20px] border border-black/10 bg-white p-3.5 sm:p-6 divide-y divide-black/10">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 sm:py-6 first:pt-0 last:pb-0 flex gap-3 sm:gap-5"
                  >
                    {/* Item Thumbnail */}
                    <div className="relative h-[84px] w-[84px] sm:h-[124px] sm:w-[124px] shrink-0 overflow-hidden rounded-[10px] sm:rounded-[14px] bg-[#F0EEED] flex items-center justify-center p-1.5 sm:p-2">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="relative h-full w-full flex items-center justify-center"
                      >
                        <Image
                                unoptimized
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          fill
                          className="object-contain p-1"
                        />
                      </Link>
                    </div>

                    {/* Middle Details + Right Actions */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      {/* Top Row: Title + Attributes and Delete Button */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 pr-1 flex-1">
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-bold text-sm sm:text-xl text-black hover:opacity-75 transition-opacity line-clamp-1 font-sans"
                          >
                            {item.product.title}
                          </Link>

                          <div className="mt-0.5 space-y-0.5 text-[11px] sm:text-sm text-black">
                            {item.sku && <p>SKU {item.sku}</p>}
                            {item.conflict && <p className="text-red-800">{human(item.conflict)}</p>}
                            {item.selectedAttributes?.Size && (
                              <p>
                                Size:{" "}
                                <span className="text-black/60 capitalize">
                                  {item.selectedAttributes.Size}
                                </span>
                              </p>
                            )}
                            {item.selectedAttributes?.Color && (
                              <p>
                                Color:{" "}
                                <span className="text-black/60 capitalize">
                                  {item.selectedAttributes.Color}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Red Delete Trash Button */}
                        <button
                          disabled={updating}
                          onClick={() => update(() => removeItem(item.id))}
                          className="text-[#FF3333] hover:opacity-75 transition-opacity p-0.5 sm:p-1 cursor-pointer shrink-0"
                          aria-label={`Remove ${item.product.title}`}
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>

                      {/* Bottom Row: Price + Quantity Controller */}
                      <div className="flex items-end justify-between pt-1 sm:pt-2">
                        <span className="font-bold text-base sm:text-2xl text-black font-sans">
                          {item.product.inStock ? usd.format(item.price) : "Unavailable"}
                        </span>

                        {/* Quantity Controller Pill: [ - 1 + ] */}
                        <div className="flex items-center bg-[#F0F0F0] rounded-full px-2.5 sm:px-5 py-1.5 sm:py-2.5 gap-3 sm:gap-6">
                          <button
                            onClick={() =>
                              update(() => updateQuantity(item.id, item.quantity - 1))
                            }
                            className="text-black hover:opacity-60 transition-opacity cursor-pointer p-0.5"
                            disabled={updating}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <span className="font-medium text-xs sm:text-base text-black min-w-3 sm:min-w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              update(() => updateQuantity(item.id, item.quantity + 1))
                            }
                            className="text-black hover:opacity-60 transition-opacity cursor-pointer p-0.5"
                            disabled={updating || item.quantity >= 99}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="rounded-[20px] border border-black/10 bg-white p-4 sm:p-6 space-y-4 sm:space-y-6 sticky top-24">
                <h2 className="font-bold text-lg sm:text-2xl text-black font-sans">
                  Order Summary
                </h2>

                {/* Breakdown Rows */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-sm sm:text-xl">
                    <span className="text-black/60">Subtotal</span>
                    <span className="font-bold text-black font-sans">
                      {usd.format(subtotal)}
                    </span>
                  </div>

                  {/* Discount (-20%) */}
                  <div className="flex justify-between items-center text-sm sm:text-xl">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-black/60">
                        Discount (-{discountPercent}%)
                      </span>
                      {promoCode && (
                        <button
                          disabled={updating}
                          onClick={() => update(removePromoCode)}
                          className="text-[10px] sm:text-xs text-black/40 hover:text-red-500 underline"
                          title="Remove promo code"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <span className="font-bold text-[#FF3333] font-sans">
                      {usd.format(-discountAmount)}
                    </span>
                  </div>

                  {/* Shipping and tax */}
                  <div className="flex justify-between items-center text-sm sm:text-xl">
                    <span className="text-black/60">Delivery Fee</span>
                    <span className="font-bold text-black font-sans">
                      Calculated at checkout
                    </span>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-black/10 my-3 sm:my-4" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-black text-base sm:text-xl">Cart total</span>
                    <span className="font-bold text-xl sm:text-2xl text-black font-sans">
                      {usd.format(total)}
                    </span>
                  </div>
                </div>

                {/* Promo Code Form */}
                <div>
                  <form onSubmit={handleApplyPromo} className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-black/40 pointer-events-none" />
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => {
                          setInputCode(e.target.value);
                          if (feedback.type) setFeedback({ type: null, message: "" });
                        }}
                        placeholder="Add promo code"
                        className="w-full bg-[#F0F0F0] rounded-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-xs sm:text-base text-black placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={updating}
                      className="bg-black text-white px-5 sm:px-9 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-base font-medium hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>

                  {/* Promo Code Feedback Message */}
                  {feedback.type && (
                    <div
                      className={`mt-2 flex items-center gap-1.5 text-xs ${
                        feedback.type === "success"
                          ? "text-green-600"
                          : "text-[#FF3333]"
                      }`}
                    >
                      {feedback.type === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Go to Checkout Button */}
                {!blocked && !updating && <Link
                  href="/checkout"
                  className="w-full bg-black text-white py-3.5 sm:py-4.5 rounded-full font-medium text-xs sm:text-base flex items-center justify-center gap-2 sm:gap-3 hover:bg-black/80 transition-all group cursor-pointer"
                >
                  <span>Go to Checkout</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
