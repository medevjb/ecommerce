import type { Category, Product } from "@/types";

const browserBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const apiBase = () => typeof window === "undefined" ? (process.env.LARAVEL_API_URL || browserBase).replace(/\/$/, "") : "/api/catalog";
export class CatalogError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function catalog<T>(path: string, signal?: AbortSignal): Promise<T> {
  return (await catalogEnvelope<T>(path, signal)).data;
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
  const images = [...(item.images ?? [])].sort((a,b) => Number(b.is_primary) - Number(a.is_primary)).map((image) => catalogImage(image.url));
  const category = item.categories?.[0] ?? { id: "", slug: "", name: "Products" };
  const optionAttributes = new Map(attributes.flatMap((attr) => attr.values.map((value) => [value.id, attr.slug] as const)));
  const variantLabel = attributes.filter((attr) => attr.values.some((value) =>
    item.variants?.some((variant) => variant.options.some((option) => option.id === value.id))
  )).map((attr) => attr.name).join(" / ");
  const variants = item.variants?.map((variant) => {
    const regular = variant.price_override_amount ?? item.regular_amount;
    const current = Math.min(regular, item.sale_amount ?? regular);
    return {
      id: variant.id, name: variant.options.map(({ name }) => name).join(" / "), sku: variant.sku,
      stock: variant.in_stock ? 1 : 0, price: current / 100, isDefault: variant.is_default,
      originalPrice: current < regular ? regular / 100 : undefined,
      attributes: Object.fromEntries(variant.options.map((value) => [optionAttributes.get(value.id) ?? value.id, value.name])),
    };
  });
  return {
    id: item.id, slug: item.slug, title: item.name, description: item.description ?? item.short_description ?? "",
    price: item.current_amount / 100, originalPrice: item.sale_amount == null ? undefined : item.regular_amount / 100,
    discountPercent: item.discount_percent, thumbnail: images[0] || "/file.svg", images: images.length ? images : ["/file.svg"],
    category, rating: Number(item.rating_average ?? 0), reviewsCount: item.rating_count,
    inStock: item.in_stock,
    createdAt: item.published_at, updatedAt: item.published_at, variants, variantLabel: variantLabel || undefined,
  };
}

export function catalogImage(url: string): string {
    const filename = url.split("/").pop()?.split("?")[0];
    if (filename) {
      const localMap: Record<string, string> = {
        "striped-tee.png": "/products/striped-tee.png",
        "striped-tee.jpg": "/products/striped-tee.png",
        "polo-tipping.png": "/products/polo-tipping.png",
        "polo-tipping.jpg": "/products/polo-tipping.png",
        "gradient-tee.png": "/products/gradient-tee.png",
        "gradient-tee.jpg": "/products/gradient-tee.png",
        "polo-contrast.jpg": "/products/polo-contrast.jpg",
        "polo-contrast.png": "/products/polo-contrast.jpg",
        "onelife-1.jpg": "/products/onelife-1.jpg",
        "onelife-2.jpg": "/products/onelife-2.jpg",
        "onelife-3.jpg": "/products/onelife-3.jpg",
        "shirt.png": "/products/shirt.png",
        "tshirt2.png": "/products/tshirt2.png",
        "jersey.png": "/products/jersey.png",
        "pent.png": "/products/pent.png",
        "pent2.png": "/products/pent2.png",
        "shortpent.png": "/products/shortpent.png",
        "shirt-full.png": "/products/shirt-full.png",
        "shirtfull2.png": "/products/shirtfull2.png",
      };
      if (localMap[filename]) {
        return localMap[filename];
      }
    }
    return url.startsWith("/") ? new URL(url, browserBase).href : url;
}

export function flattenCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children ?? [])]);
}

export async function catalogEnvelope<T>(path: string, signal?: AbortSignal) {
  const response = await fetch(apiBase() + path, { headers: { Accept: "application/json" }, cache: "no-store", signal });
  if (!response.ok) throw new CatalogError(response.status, "Could not load the store catalog.");
  return response.json() as Promise<{ data: T; meta: { pagination?: import("./staff-api").PageInfo } | null }>;
}

export function catalogPage(path: string, signal?: AbortSignal) {
  return catalogEnvelope<CatalogProduct[]>(path, signal);
}
