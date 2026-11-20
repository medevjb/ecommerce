"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { ProductCard } from "./product-card";
import { adaptProduct, catalog, catalogPage, flattenCategories, swatch, type CatalogAttribute, type CatalogCategory } from "@/lib/catalog";
import type { Product } from "@/types";
import type { PageInfo } from "@/lib/staff-api";

const SORT_OPTIONS = [
  "Most Popular",
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
];

export function ShopPageView() {
  const query = useSearchParams();
  const collection = query.get("collection");
  const search = query.get("q")?.trim();
  const brand = query.get("brand");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(query.get("category"));
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(500);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sortBy, setSortBy] = useState(collection === "new-arrivals" ? "Newest" : "Most Popular");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Accordion open/close states
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isColorsOpen, setIsColorsOpen] = useState(true);
  const [isSizesOpen, setIsSizesOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PageInfo>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [attributes, setAttributes] = useState<CatalogAttribute[]>([]);
  const [applied, setApplied] = useState({ min: 0, max: 500, color: "", size: "", category: query.get("category") });
  const colors = (attributes.find(({slug}) => slug === "color")?.values ?? []).map((option) => ({ ...option, hex: swatch[option.slug] ?? "#b4b4b4" }));
  const sizes = attributes.find(({slug}) => slug === "size")?.values ?? [];

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([catalog<CatalogCategory[]>("/categories", controller.signal),catalog<CatalogAttribute[]>("/attributes",controller.signal)])
      .then(([groups, options]) => { setCategories(flattenCategories(groups)); setAttributes(options); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({page:String(currentPage),per_page:"9",sort:
      sortBy === "Newest" ? "newest" : sortBy === "Price: Low to High" ? "price_asc" : sortBy === "Price: High to Low" ? "price_desc" : "top_selling"});
    if (applied.category) params.set("category",applied.category);
    if (applied.min > 0) params.set("min_price",String(applied.min * 100));
    if (applied.max < 500) params.set("max_price",String(applied.max * 100));
    if (brand) params.set("brand",brand);
    if (search) params.set("search", search);
    for (const id of [applied.color,applied.size]) if (id) params.append("attribute_value_ids[]",id);
    catalogPage("/products?" + params.toString(),controller.signal)
      .then(({data,meta}) => { setProducts(data.map((product) => adaptProduct(product))); setPagination(meta?.pagination); setError(""); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied, brand, currentPage, search, sortBy]);

  // Sidebar Filter Content (Shared between desktop and mobile drawer)
  const FilterContent = (
    <div className="space-y-6 font-sans">
      {/* Filters Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/10">
        <h2 className="font-bold text-xl text-black">Filters</h2>
        <SlidersHorizontal className="h-5 w-5 text-black/40" />
      </div>

      {/* Category List */}
      <div className="space-y-2 pb-5 border-b border-black/10">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() =>
                setSelectedCategory(isActive ? null : cat.slug)
              }
              className={`flex w-full items-center justify-between py-1.5 text-base transition-colors cursor-pointer ${
                isActive
                  ? "font-semibold text-black"
                  : "text-black/60 hover:text-black"
              }`}
            >
              <span>{cat.name}</span>
              <ChevronRight className="h-4 w-4 text-black/40" />
            </button>
          );
        })}
      </div>

      {/* Price Accordion */}
      <div className="pb-5 border-b border-black/10">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-lg text-black cursor-pointer"
        >
          <span>Price</span>
          {isPriceOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isPriceOpen && (
          <div className="pt-5 space-y-4">
            {/* Visual Dual Slider Track */}
            <div className="relative flex items-center h-5">
              {/* Background Track */}
              <div className="absolute h-1.5 w-full rounded-full bg-[#F0F0F0]" />
              {/* Active Segment */}
              <div
                className="absolute h-1.5 rounded-full bg-black"
                style={{
                  left: `${(priceMin / 500) * 100}%`,
                  right: `${100 - (priceMax / 500) * 100}%`,
                }}
              />
              {/* Native range inputs overlaid */}
              <input
                type="range"
                min="0"
                max="500"
                value={priceMin}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), priceMax - 10);
                  setPriceMin(val);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto"
                aria-label="Minimum price"
              />
              <input
                type="range"
                min="0"
                max="500"
                value={priceMax}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), priceMin + 10);
                  setPriceMax(val);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer pointer-events-auto"
                aria-label="Maximum price"
              />
              {/* Left Thumb */}
              <div
                className="absolute h-5 w-5 rounded-full bg-black shadow-md -translate-x-1/2 pointer-events-none"
                style={{ left: `${(priceMin / 500) * 100}%` }}
              />
              {/* Right Thumb */}
              <div
                className="absolute h-5 w-5 rounded-full bg-black shadow-md -translate-x-1/2 pointer-events-none"
                style={{ left: `${(priceMax / 500) * 100}%` }}
              />
            </div>

            {/* Price Values Display */}
            <div className="flex items-center justify-between text-sm font-medium text-black pt-1">
              <span>${priceMin}</span>
              <span>${priceMax}</span>
            </div>
          </div>
        )}
      </div>

      {/* Colors Accordion */}
      <div className="pb-5 border-b border-black/10">
        <button
          onClick={() => setIsColorsOpen(!isColorsOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-lg text-black cursor-pointer"
        >
          <span>Colors</span>
          {isColorsOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isColorsOpen && (
          <div className="pt-4 grid grid-cols-5 gap-3">
            {colors.map((col) => {
              const isSelected = selectedColor === col.id;
              return (
                <button
                  key={col.name}
                  onClick={() =>
                    setSelectedColor(isSelected ? "" : col.id)
                  }
                  style={{ backgroundColor: col.hex }}
                  className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs ${
                    col.hex === "#FFFFFF" ? "border border-black/20" : ""
                  }`}
                  title={col.name}
                  aria-label={`Select color ${col.name}`}
                >
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 stroke-[3] ${
                        col.hex === "#FFFFFF" ? "text-black" : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Size Accordion */}
      <div className="pb-5 border-b border-black/10">
        <button
          onClick={() => setIsSizesOpen(!isSizesOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-lg text-black cursor-pointer"
        >
          <span>Size</span>
          {isSizesOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isSizesOpen && (
          <div className="pt-4 flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() =>
                    setSelectedSize(isSelected ? "" : size.id)
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-black text-white"
                      : "bg-[#F0F0F0] text-black/60 hover:bg-[#e6e6e6]"
                  }`}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Filter Button */}
      <div className="pt-2">
        <button
          onClick={() => { setLoading(true); setCurrentPage(1); setApplied({min:priceMin,max:priceMax,color:selectedColor,size:selectedSize,category:selectedCategory}); setIsMobileFilterOpen(false); }}
          className="w-full rounded-full bg-black py-4 text-center text-sm font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] cursor-pointer shadow-xs"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pb-24">
      {/* Breadcrumb: Home > Casual */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-black/60 pt-6 pb-6 sm:pb-8 font-sans"
      >
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4 text-black/40" />
        <span className="text-black font-medium">{search ? "Search results" : "Shop"}</span>
      </nav>

      {/* Main Grid: Sidebar Filters (Left) + Product Catalog (Right) */}
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
        {/* Desktop Left Sidebar Filters */}
        <aside className="hidden lg:block w-[295px] shrink-0 rounded-[20px] border border-black/10 bg-white p-6 shadow-xs">
          {FilterContent}
        </aside>

        {/* Mobile Filter Slide-in Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            {/* Sheet */}
            <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-4">
                <span className="font-bold text-lg text-black font-sans">
                  Filters
                </span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-black/60 hover:text-black"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {FilterContent}
            </div>
          </div>
        )}

        {/* Right Product Grid Area */}
        <main className="flex-1 w-full">
          {/* Header Row: Title on Left, Stats & Sort on Right */}
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
            <h1 className="font-bold text-2xl sm:text-[32px] text-black font-sans">
              {search ? "Search results" : "Shop"}
            </h1>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-black/60 font-sans hidden sm:inline">
                Showing 1-10 of 100 Products
              </span>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-sans text-black/60 hover:text-black transition-colors cursor-pointer"
                  aria-label="Sort products"
                >
                  <span className="hidden sm:inline">Sort by:</span>
                  <span className="font-semibold text-black">{sortBy}</span>
                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
                </button>

                {isSortDropdownOpen && (
                  <div
                    onMouseLeave={() => setIsSortDropdownOpen(false)}
                    className="absolute right-0 top-full mt-2 w-44 sm:w-48 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl z-30"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left rounded-lg px-3 py-2 text-xs sm:text-sm font-sans transition-colors ${
                          sortBy === opt
                            ? "bg-[#F0F0F0] font-semibold text-black"
                            : "text-black/70 hover:bg-[#F9F9F9]"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Filter Trigger Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex lg:hidden h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#F0F0F0] text-black hover:bg-[#e6e6e6] transition-colors cursor-pointer shrink-0"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>

          {loading && <p role="status">Loading products…</p>}
          {error && <p role="alert" className="mb-4 text-red-800">{error}</p>}
          {!loading && !error && products.length === 0 && <p className="mb-4 text-slate-600">No products match these filters.</p>}
          {/* 3-Column Product Grid (2-column on mobile) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Row */}
          <div className="border-t border-black/10 mt-8 sm:mt-10 pt-5 sm:pt-6 flex items-center justify-between font-sans">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1.5 rounded-[8px] border border-black/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentPage === 1
                  ? "text-black/30 border-black/5 cursor-not-allowed"
                  : "text-black hover:bg-black/5"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Previous
            </button>

            <span className="text-sm">Page {currentPage} of {pagination?.last_page ?? 1}</span>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination?.last_page ?? 1, p + 1))}
              disabled={currentPage >= (pagination?.last_page ?? 1)}
              className={`flex items-center gap-1.5 rounded-[8px] border border-black/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentPage >= (pagination?.last_page ?? 1)
                  ? "text-black/30 border-black/5 cursor-not-allowed"
                  : "text-black hover:bg-black/5"
              }`}
            >
              Next <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
