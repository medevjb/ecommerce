import { Suspense } from "react";
import { ShopPageView } from "@/components/storefront/shop-page-view";

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 lg:px-12">
          <div className="h-96 w-full animate-pulse rounded-[20px] bg-zinc-100" />
        </div>
      }
    >
      <ShopPageView />
    </Suspense>
  );
}
