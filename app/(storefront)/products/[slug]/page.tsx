import { Preloader } from "@/components/shared/preloader";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { serverCatalog, serverCatalogEnvelope } from "@/lib/server-catalog";
import { fetchStoreSettings } from "@/components/storefront/store-shell";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { adaptProduct, CatalogError, type CatalogAttribute, type CatalogProduct, type CatalogReview } from "@/lib/catalog";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

const getProduct = cache((slug: string) => serverCatalog<CatalogProduct>("/products/" + encodeURIComponent(slug)));

export async function generateMetadata({params}: ProductDetailPageProps): Promise<Metadata> {
  const {slug} = await params;
  const [product, settings] = await Promise.all([getProduct(slug).catch(() => null), fetchStoreSettings()]);
  if (!product) return {};
  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description || product.description || settings.seo_description || undefined,
  };
}

async function ProductDetailLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = "/products/" + encodeURIComponent(slug);
  const [product, attributes, related, reviews] = await Promise.all([
    getProduct(slug),
    serverCatalog<CatalogAttribute[]>("/attributes").catch(() => []),
    serverCatalog<CatalogProduct[]>(base + "/related").catch(() => []),
    serverCatalogEnvelope<CatalogReview[]>(base + "/reviews").catch(() => null),
  ]).catch((error: unknown) => {
    if (error instanceof CatalogError && error.status === 404) notFound();
    throw error;
  });
  return <ProductDetailView key={product.id} product={adaptProduct(product, attributes)} related={related.map((item) => adaptProduct(item))} reviews={reviews?.data ?? null} reviewsPagination={reviews?.meta?.pagination} />;
}

export default function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  return (
    <Suspense
      fallback={<Preloader label="Loading product" />}
    >
      <ProductDetailLoader params={params} />
    </Suspense>
  );
}
