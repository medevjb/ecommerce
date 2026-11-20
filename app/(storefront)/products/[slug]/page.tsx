import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { adaptProduct, catalog, CatalogError, type CatalogAttribute, type CatalogProduct, type CatalogReview } from "@/lib/catalog";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function ProductDetailLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = "/products/" + encodeURIComponent(slug);
  const [product, attributes, related, reviews] = await Promise.all([
    catalog<CatalogProduct>(base), catalog<CatalogAttribute[]>("/attributes"),
    catalog<CatalogProduct[]>(base + "/related"), catalog<CatalogReview[]>(base + "/reviews"),
  ]).catch((error: unknown) => {
    if (error instanceof CatalogError && error.status === 404) notFound();
    throw error;
  });
  return <ProductDetailView key={product.id} product={adaptProduct(product, attributes)} related={related.map((item) => adaptProduct(item))} reviews={reviews} />;
}

export default function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
          <div className="h-96 w-full animate-pulse rounded-[20px] bg-zinc-100" />
        </div>
      }
    >
      <ProductDetailLoader params={params} />
    </Suspense>
  );
}
