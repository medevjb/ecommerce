"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  adaptProduct,
  catalog,
  catalogPage,
  flattenCategories,
  swatch,
  type CatalogAttribute,
  type CatalogCategory,
  type CatalogOption,
} from "@/lib/catalog";
import type { Product } from "@/types";
import type { PageInfo } from "@/lib/staff-api";

const SORT_OPTIONS = [
  "Most Popular",
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
];

const COLOR_SWATCHES: Record<string, string> = { ...swatch, cyan: "#06caf5" };

export function ShopPageView() {
  const query = useSearchParams();
  return <ShopCatalog key={query.toString()} query={query} />;
}

function ShopCatalog({ query }: { query: ReturnType<typeof useSearchParams> }) {
  const collection = query.get("collection");
  const search = query.get("q")?.trim();
  const [selectedBrand, setSelectedBrand] = useState(query.get("brand") ?? "");
  const [stockOnly, setStockOnly] = useState(query.get("in_stock") === "1");

  const initialCategories = [...query.getAll("category"), ...query.getAll("categories[]"), ...query.getAll("categories")];
  const [selectedCategories, setSelectedCategories] = useState<string[]>([...new Set(initialCategories)]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(300);
  const priceTrackRef = useRef<HTMLDivElement>(null);
  const activePriceThumb = useRef<"min" | "max" | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const initialStyles = [...query.getAll("style"), ...query.getAll("styles[]"), ...query.getAll("styles")];
  const [selectedDressStyles, setSelectedDressStyles] = useState<string[]>([...new Set(initialStyles)]);
  const [sortBy, setSortBy] = useState(
    collection === "new-arrivals" ? "Newest" : "Most Popular"
  );
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Accordion open/close states
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isColorsOpen, setIsColorsOpen] = useState(true);
  const [isSizesOpen, setIsSizesOpen] = useState(true);
  const [isDressStyleOpen, setIsDressStyleOpen] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PageInfo>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [brands, setBrands] = useState<CatalogOption[]>([]);
  const [styles, setStyles] = useState<CatalogCategory[]>([]);
  const [filterError, setFilterError] = useState("");
  const [attributes, setAttributes] = useState<CatalogAttribute[]>([]);
  const [applied, setApplied] = useState({
    min: 0,
    max: 300,
    color: "",
    size: "",
    categories: [...new Set(initialCategories)],
    dressStyles: [...new Set(initialStyles)],
    brand: query.get("brand") ?? "",
    stock: query.get("in_stock") === "1",
  });

  function updatePriceFromPointer(clientX: number) {
    const track = priceTrackRef.current;
    const activeThumb = activePriceThumb.current;
    if (!track || !activeThumb) return;

    const { left, width } = track.getBoundingClientRect();
    const nextPrice = Math.round(Math.max(0, Math.min(1, (clientX - left) / width)) * 300);

    if (activeThumb === "min") {
      setPriceMin(Math.min(nextPrice, priceMax - 10));
    } else {
      setPriceMax(Math.max(nextPrice, priceMin + 10));
    }
  }

  function handlePriceKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, thumb: "min" | "max") {
    const currentPrice = thumb === "min" ? priceMin : priceMax;
    const lowerBound = thumb === "min" ? 0 : priceMin + 10;
    const upperBound = thumb === "min" ? priceMax - 10 : 300;
    const step = event.shiftKey ? 10 : 1;
    let nextPrice = currentPrice;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        nextPrice += step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        nextPrice -= step;
        break;
      case "Home":
        nextPrice = lowerBound;
        break;
      case "End":
        nextPrice = upperBound;
        break;
      default:
        return;
    }

    event.preventDefault();
    const boundedPrice = Math.max(lowerBound, Math.min(upperBound, nextPrice));
    if (thumb === "min") {
      setPriceMin(boundedPrice);
    } else {
      setPriceMax(boundedPrice);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      catalog<CatalogCategory[]>("/categories", controller.signal),
      catalog<CatalogAttribute[]>("/attributes", controller.signal),
      catalog<CatalogOption[]>("/brands", controller.signal),
    ])
      .then(([groups, options, availableBrands]) => {
        setBrands(availableBrands);
        setCategories(flattenCategories(groups.filter((group) => group.slug !== "dress-styles")));
        setStyles(flattenCategories(groups.find((group) => group.slug === "dress-styles")?.children ?? []));
        setAttributes(options);
        setFilterError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setFilterError("Filter options could not be loaded.");
      });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: "9",
      sort:
        sortBy === "Newest"
          ? "newest"
          : sortBy === "Price: Low to High"
          ? "price_asc"
          : sortBy === "Price: High to Low"
          ? "price_desc"
          : "top_selling",
    });
    for (const category of applied.categories) params.append("categories[]", category);
    if (applied.min > 0) params.set("min_price", String(applied.min * 100));
    if (applied.max < 300) params.set("max_price", String(applied.max * 100));
    if (applied.brand) params.set("brand", applied.brand);
    if (applied.stock) params.set("in_stock", "1");
    if (search) params.set("search", search);
    for (const style of applied.dressStyles) params.append("styles[]", style);
    for (const option of [applied.color, applied.size]) if (option) params.append("attribute_value_ids[]",option);

    catalogPage("/products?" + params.toString(), controller.signal)
      .then(({data, meta}) => {
        if (controller.signal.aborted) return;
        setProducts(data.map((product) => adaptProduct(product)));
        setPagination(meta?.pagination);
        setError("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("The store catalog is temporarily unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [applied, currentPage, retry, search, sortBy]);

  const displayCategories = categories;
  const colors = (attributes.find(({slug}) => slug === "color")?.values ?? [])
    .map((option) => ({...option, hex: COLOR_SWATCHES[option.slug] ?? "#b4b4b4"}));
  const sizes = attributes.find(({slug}) => slug === "size")?.values ?? [];
  const lastPage = pagination?.last_page ?? 1;
  const pageNumbers = [...new Set([1, 2, currentPage, lastPage - 1, lastPage])].filter((page) => page >= 1 && page <= lastPage).sort((left,right)=>left-right);
  const firstResult = !loading && pagination?.total ? (currentPage-1)*pagination.per_page+1 : 0;
  const lastResult = !loading && pagination ? Math.min(pagination.total,currentPage*pagination.per_page) : 0;

  function goToPage(page: number) {
    if (page === currentPage) return;
    setLoading(true);
    setCurrentPage(page);
  }

  // Filter content component
  const renderFilterContent = (isMobile = false) => (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/10">
        <h2 className="font-bold text-xl text-black">Filters</h2>
        {isMobile ? (
          <button
            onClick={() => setIsMobileFilterOpen(false)}
            className="p-1 text-black/40 hover:text-black transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <SlidersHorizontal className="h-5 w-5 text-black/40" />
        )}
      </div>

      {filterError && <p role="alert" className="text-sm text-red-800">{filterError} <button type="button" className="underline" onClick={() => setRetry((count) => count + 1)}>Retry</button></p>}

      <div className="space-y-1 pb-4 border-b border-black/10">
        {displayCategories.map((cat) => {
          const isActive = selectedCategories.includes(cat.slug);
          return (
            <label
              key={cat.slug}
              className={`flex w-full cursor-pointer items-center justify-between py-1.5 text-sm transition-colors sm:text-base ${isActive ? "font-semibold text-black" : "text-black/60 hover:text-black"}`}
            >
              <span>{cat.name}</span>
              <input
                type="checkbox"
                checked={isActive}
                aria-label={`Filter by ${cat.name}`}
                onChange={() => setSelectedCategories((current) => isActive ? current.filter((slug) => slug !== cat.slug) : [...current, cat.slug])}
                className="size-4 cursor-pointer accent-black"
              />
            </label>
          );
        })}
      </div>

      <div className="space-y-2 border-b border-black/10 pb-4">
        <label className="block text-sm font-semibold">
          Brand
          <select className="mt-2 block w-full rounded-xl border border-black/20 px-3 py-2 font-normal" value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}>
            <option value="">All brands</option>
            {selectedBrand && !brands.some(({slug}) => slug === selectedBrand) && <option value={selectedBrand}>{selectedBrand}</option>}
            {brands.map(({id, slug, name}) => <option key={id} value={slug}>{name}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} /> In stock only</label>
      </div>

      {/* Price Accordion */}
      <div className="pb-4 border-b border-black/10">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-base sm:text-lg text-black cursor-pointer"
        >
          <span>Price</span>
          {isPriceOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isPriceOpen && (
          <div className="pt-3 space-y-2">
            {/* Visual Dual Slider Track */}
            <div
              ref={priceTrackRef}
              className="relative flex h-5 touch-none items-center"
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const clickedPrice = Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 300);
                activePriceThumb.current = Math.abs(clickedPrice - priceMin) <= Math.abs(clickedPrice - priceMax) ? "min" : "max";
                event.currentTarget.setPointerCapture(event.pointerId);
                updatePriceFromPointer(event.clientX);
              }}
              onPointerMove={(event) => {
                if (activePriceThumb.current) updatePriceFromPointer(event.clientX);
              }}
              onPointerUp={(event) => {
                activePriceThumb.current = null;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={() => {
                activePriceThumb.current = null;
              }}
            >
              {/* Background Track */}
              <div className="absolute h-1.5 w-full rounded-full bg-[#F0F0F0]" />
              {/* Active Segment */}
              <div
                className="absolute h-1.5 rounded-full bg-black"
                style={{
                  left: `${(priceMin / 300) * 100}%`,
                  right: `${100 - (priceMax / 300) * 100}%`,
                }}
              />
              <button
                type="button"
                role="slider"
                aria-label="Minimum price"
                aria-valuemin={0}
                aria-valuemax={priceMax - 10}
                aria-valuenow={priceMin}
                aria-valuetext={`${priceMin} dollars`}
                onKeyDown={(event) => handlePriceKeyDown(event, "min")}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => {
                  if (activePriceThumb.current === "min") updatePriceFromPointer(event.clientX);
                }}
                onPointerUp={() => {
                  activePriceThumb.current = null;
                }}
                onPointerCancel={() => {
                  activePriceThumb.current = null;
                }}
                className="absolute h-5 w-5 rounded-full bg-black shadow-md -translate-x-1/2 pointer-events-none"
                style={{ left: `${(priceMin / 300) * 100}%` }}
                tabIndex={0}
              />
              <button
                type="button"
                role="slider"
                aria-label="Maximum price"
                aria-valuemin={priceMin + 10}
                aria-valuemax={300}
                aria-valuenow={priceMax}
                aria-valuetext={`${priceMax}${priceMax === 300 ? " or more" : " dollars"}`}
                onKeyDown={(event) => handlePriceKeyDown(event, "max")}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => {
                  if (activePriceThumb.current === "max") updatePriceFromPointer(event.clientX);
                }}
                onPointerUp={() => {
                  activePriceThumb.current = null;
                }}
                onPointerCancel={() => {
                  activePriceThumb.current = null;
                }}
                className="absolute h-5 w-5 rounded-full bg-black shadow-md -translate-x-1/2 pointer-events-none"
                style={{ left: `${(priceMax / 300) * 100}%` }}
                tabIndex={0}
              />
            </div>

            {/* Price Values Display */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-black pt-1">
              <span>${priceMin}</span>
              <span>${priceMax}{priceMax === 300 ? "+" : ""}</span>
            </div>
          </div>
        )}
      </div>

      {/* Colors Accordion */}
      <div className="pb-4 border-b border-black/10">
        <button
          onClick={() => setIsColorsOpen(!isColorsOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-base sm:text-lg text-black cursor-pointer"
        >
          <span>Colors</span>
          {isColorsOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isColorsOpen && (
          <div className="pt-2 flex flex-wrap gap-2">
            {colors.map((col) => {
              const isSelected = Boolean(col.id && selectedColor === col.id);
              return (
                <button
                  key={col.name}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedColor(isSelected ? "" : col.id)}
                  style={{ backgroundColor: col.hex }}
                  className={`relative h-9 w-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs ${
                    ["#fff", "#ffffff"].includes(col.hex.toLowerCase()) ? "border border-black/30 ring-1 ring-black/10" : ""
                  }`}
                  title={col.name}
                  aria-label={`Select color ${col.name}`}
                >
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 stroke-[3] ${
                        ["#fff", "#ffffff", "#f5dd06", "#facc15"].includes(col.hex.toLowerCase())
                          ? "text-black"
                          : "text-white"
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
      <div className="pb-4 border-b border-black/10">
        <button
          onClick={() => setIsSizesOpen(!isSizesOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-base sm:text-lg text-black cursor-pointer"
        >
          <span>Size</span>
          {isSizesOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isSizesOpen && (
          <div className="pt-3 grid grid-cols-3 gap-2">
            {sizes.map((size) => {
              const isSelected = Boolean(size.id && selectedSize === size.id);
              return (
                <button
                  key={size.name}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedSize(isSelected ? "" : size.id)}
                  className={`rounded-full py-2.5 px-1 sm:px-3 text-xs sm:text-sm font-normal text-center flex items-center justify-center transition-all cursor-pointer ${
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

      <div className="pb-4 border-b border-black/10">
        <button
          onClick={() => setIsDressStyleOpen(!isDressStyleOpen)}
          className="flex w-full items-center justify-between py-1 font-bold text-base sm:text-lg text-black cursor-pointer"
        >
          <span>Dress Style</span>
          {isDressStyleOpen ? (
            <ChevronUp className="h-4 w-4 text-black" />
          ) : (
            <ChevronDown className="h-4 w-4 text-black" />
          )}
        </button>

        {isDressStyleOpen && (
          <div className="pt-2 space-y-1">
            {styles.map((style) => {
              const isActive = selectedDressStyles.includes(style.slug);
              return (
                <label
                  key={style.slug}
                  className={`flex w-full cursor-pointer items-center justify-between py-1 text-sm transition-colors sm:text-base ${isActive ? "font-semibold text-black" : "text-black/60 hover:text-black"}`}
                >
                  <span>{style.name}</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    aria-label={`Filter by ${style.name}`}
                    onChange={() => {
                      const nextStyles = isActive
                        ? selectedDressStyles.filter((slug) => slug !== style.slug)
                        : [...selectedDressStyles, style.slug];
                      setSelectedDressStyles(nextStyles);
                      setCurrentPage(1);
                      setLoading(true);
                      setApplied((current) => ({ ...current, dressStyles: nextStyles }));
                    }}
                    className="size-4 cursor-pointer accent-black"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Filter Button */}
      <div className="pt-1">
        <button
          onClick={() => {
            setLoading(true);
            setCurrentPage(1);
            setApplied({
              min: priceMin,
              max: priceMax,
              color: selectedColor,
              size: selectedSize,
              categories: selectedCategories,
              dressStyles: selectedDressStyles,
              brand: selectedBrand,
              stock: stockOnly,
            });
            setIsMobileFilterOpen(false);
          }}
          className="w-full rounded-full bg-black py-3 text-center text-sm font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] cursor-pointer shadow-xs"
        >
          Apply filters
        </button>
        <button
          type="button"
          className="mt-2 w-full text-sm underline"
          onClick={() => {
            setSelectedCategories([]);
            setSelectedDressStyles([]);
            setSelectedBrand("");
            setStockOnly(false);
            setSelectedColor("");
            setSelectedSize("");
            setPriceMin(0);
            setPriceMax(300);
            setCurrentPage(1);
            setApplied({ min: 0, max: 300, color: "", size: "", categories: [], dressStyles: [], brand: "", stock: false });
            setLoading(true);
          }}
        >
          Clear filters
        </button>
      </div>
    </div>
  );

  const selectedCategoryNames = displayCategories.filter((category) => applied.categories.includes(category.slug)).map((category) => category.name);
  const selectedStyleNames = styles.filter((style) => applied.dressStyles.includes(style.slug)).map((style) => style.name);
  const categoryTitle = search ? "Search results"
    : [...selectedCategoryNames, ...selectedStyleNames].join(", ")
    || (collection === "new-arrivals" ? "New Arrivals" : collection === "top-selling" ? "Top Selling" : "Shop");

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pb-24">
      {/* Breadcrumb: Home > Casual */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-black/60 pt-4 pb-4 sm:pt-6 sm:pb-8 font-sans"
      >
        <Link href="/" className="hover:text-black transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black/40" />
        <span className="text-black font-medium">{categoryTitle}</span>
      </nav>

      {/* Main Grid: Sidebar Filters (Left) + Product Catalog (Right) */}
      <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
        {/* Desktop Left Sidebar Filters */}
        <aside className="hidden lg:block w-[295px] shrink-0 rounded-[20px] border border-black/10 bg-white p-5 shadow-xs">
          {renderFilterContent(false)}
        </aside>

        {/* Mobile Filter Bottom Sheet / Modal Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            {/* Sheet Container with rounded top */}
            <div className="relative z-10 w-full h-[calc(100vh-70px)] bg-white rounded-t-[20px] p-4 sm:p-5 overflow-y-auto shadow-2xl">
              {renderFilterContent(true)}
            </div>
          </div>
        )}

        {/* Right Product Grid Area */}
        <main className="flex-1 w-full">
          {/* Header Row: Title on Left, Stats & Sort on Right */}
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
            <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
              <h1 className="font-bold text-2xl sm:text-[32px] text-black font-sans">
                {categoryTitle}
              </h1>
              <span className="text-xs sm:text-sm text-black/60 font-sans">
                {!loading && !error && `Showing ${firstResult}–${lastResult} of ${pagination?.total ?? 0} products`}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Sort Dropdown (Desktop / Tablet) */}
              <div className="relative">
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-sans text-black/60 hover:text-black transition-colors cursor-pointer"
                  aria-label="Sort products"
                >
                  <span>Sort by:</span>
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
                          if (opt !== sortBy || currentPage !== 1) setLoading(true);
                          setCurrentPage(1);
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
                id="mobile-filter-button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="flex lg:hidden h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#F0F0F0] text-black hover:bg-[#e6e6e6] transition-colors cursor-pointer shrink-0"
                aria-label="Open filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading && <p role="status">Loading products…</p>}
          {error && (
            <div
              role="alert"
              className="fixed bottom-5 right-5 z-50 w-[min(24rem,calc(100%-2.5rem))] rounded-2xl border border-red-100 bg-white p-4 shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">
                    Couldn’t load the catalog
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={18} />
                </button>
              </div>
              <button
                type="button"
                className="mt-3 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                onClick={() => {
                  setError("");
                  setLoading(true);
                  setRetry((attempt) => attempt + 1);
                }}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !products.length && <p role="status" className="mb-5 text-sm text-black/60">No products match these filters.</p>}
          {/* 3-Column Product Grid (2-column on mobile) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {!loading && !error && products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination Row */}
          <div className="border-t border-black/10 mt-8 sm:mt-10 pt-5 sm:pt-6 flex items-center justify-between font-sans">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex items-center gap-1.5 rounded-[8px] border border-black/10 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentPage === 1
                  ? "text-black/30 border-black/5 cursor-not-allowed"
                  : "text-black hover:bg-black/5"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {pageNumbers.map((page,index) => <span key={page} className="flex items-center">
                {index > 0 && page - pageNumbers[index-1] > 1 && <span className="px-0.5 sm:px-1 text-xs sm:text-sm text-black/40">...</span>}
                <button
                  type="button"
                  aria-current={page === currentPage ? "page" : undefined}
                  onClick={() => goToPage(page)}
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-[8px] text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center ${currentPage === page ? "bg-black/5 text-black" : "text-black/60 hover:text-black"}`}
                >{page}</button>
              </span>)}
            </div>

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= (lastPage)}
              className={`flex items-center gap-1.5 rounded-[8px] border border-black/10 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                currentPage >= (lastPage)
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
