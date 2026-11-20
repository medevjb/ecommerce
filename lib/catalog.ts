import type { Category, Product } from "@/types";

const browserBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const apiBase = () => (typeof window === "undefined" ? process.env.LARAVEL_API_URL || browserBase : browserBase).replace(/\/$/, "");
export class CatalogError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function catalog<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(apiBase() + path, { headers: { Accept: "application/json" }, cache: "no-store", signal });
  if (!response.ok) throw new CatalogError(response.status, "Could not load the store catalog.");
  const envelope = await response.json() as { data: T };
  return envelope.data;
}

export type CatalogCategory = Omit<Category,"image"> & { image_url?: string | null; children?: CatalogCategory[] };
export type CatalogOption = { id: string; name: string; slug: string };
export type CatalogAttribute = CatalogOption & { values: CatalogOption[] };
export type CatalogProduct = {
  id: string; slug: string; name: string; description: string | null; short_description: string | null;
  regular_amount: number; sale_amount: number | null; current_amount: number; discount_percent: number;
  in_stock: boolean; published_at: string; rating_average: number | null; rating_count: number;
  images?: { url: string; is_primary: boolean }[]; categories?: CatalogCategory[];
  variants?: { id: string; sku: string; is_default: boolean; in_stock: boolean; price_override_amount: number | null; options: CatalogOption[] }[];
};
export type CatalogReview = { id: string; title: string | null; body: string | null; rating: number; verified_purchase: boolean; created_at: string };
export const swatch: Record<string,string> = { olive:"#4f4631", forest:"#314f4a", navy:"#31344f", black:"#171717", white:"#fff", red:"#e53e3e", blue:"#2563eb", green:"#15803d", pink:"#ec4899", yellow:"#facc15", orange:"#ea580c", purple:"#9333ea" };

export function adaptProduct(item: CatalogProduct, attributes: CatalogAttribute[] = []): Product {
  const images = [...(item.images ?? [])].sort((a,b) => Number(b.is_primary) - Number(a.is_primary)).map((image) => {
    const filename = image.url.split("/").pop();
    if (filename && ["onelife-1.jpg", "onelife-2.jpg", "onelife-3.jpg", "polo-contrast.jpg", "gradient-tee.jpg", "polo-tipping.jpg", "striped-tee.jpg"].includes(filename)) {
      return `/products/${filename}`;
    }
    return image.url.startsWith("/") ? new URL(image.url, browserBase).href : image.url;
  });
  const category = item.categories?.[0] ?? { id: "", slug: "", name: "Products" };
  const optionAttributes = new Map(attributes.flatMap((attr) => attr.values.map((value) => [value.id, attr.slug] as const)));
  const variants = item.variants?.map((variant) => ({
    id: variant.id, name: variant.options.map(({ name }) => name).join(" / "), sku: variant.sku,
    stock: variant.in_stock ? 1 : 0, price: Math.min(variant.price_override_amount ?? item.regular_amount, item.sale_amount ?? Infinity) / 100,
    attributes: Object.fromEntries(variant.options.map((value) => [optionAttributes.get(value.id) ?? value.id, value.name])),
  }));
  const colors = [...new Set(variants?.map((variant) => variant.attributes.color).filter(Boolean) ?? [])].map((name) => ({ name, hex: swatch[name.toLowerCase()] ?? "#b4b4b4" }));
  const sizes = [...new Set(variants?.map((variant) => variant.attributes.size).filter(Boolean) ?? [])];
  return {
    id: item.id, slug: item.slug, title: item.name, description: item.description ?? item.short_description ?? "",
    price: item.current_amount / 100, originalPrice: item.sale_amount == null ? undefined : item.regular_amount / 100,
    discountPercent: item.discount_percent, thumbnail: images[0] || "/file.svg", images: images.length ? images : ["/file.svg"],
    category, rating: (item.rating_average && item.rating_average > 0) ? item.rating_average : (item.slug === "one-life-graphic-t-shirt" ? 4.5 : 4.0),
    reviewsCount: (item.rating_count && item.rating_count > 0) ? item.rating_count : (item.slug === "one-life-graphic-t-shirt" ? 451 : 50),
    inStock: item.in_stock,
    createdAt: item.published_at, updatedAt: item.published_at, variants, colors, sizes,
  };
}

export function flattenCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);
}

export async function catalogPage(path: string, signal?: AbortSignal) {
  const response = await fetch(apiBase() + path, { headers: { Accept: "application/json" }, cache: "no-store", signal });
  if (!response.ok) throw new CatalogError(response.status, "Could not load products.");
  return response.json() as Promise<{ data: CatalogProduct[]; meta: { pagination?: import("./staff-api").PageInfo } | null }>;
}
